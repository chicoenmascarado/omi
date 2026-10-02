import Foundation

/// Resolves the language proactive assistants write user-visible text in.
///
/// The backend stores one preferred language per account (`/v1/users/language`). Every
/// assistant that produces text the user reads (tasks, memories, insights, goals) appends
/// `instruction(for:)` to its system prompt so a Spanish-speaking user does not get
/// English tasks next to a Spanish UI. English needs no instruction: the prompts are
/// already written in English.
actor AssistantOutputLanguage {
  static let shared = AssistantOutputLanguage()

  static let cacheLifetime: TimeInterval = 3600

  private let fetchPreferred: @Sendable () async throws -> String
  private let fallbackLanguage: @Sendable () async -> String
  private let currentOwnerId: @Sendable () -> String?
  private let now: @Sendable () -> Date

  private var cached: (ownerId: String?, language: String?, fetchedAt: Date)?

  init(
    fetchPreferred: @escaping @Sendable () async throws -> String = {
      try await APIClient.shared.getUserLanguage().language
    },
    fallbackLanguage: @escaping @Sendable () async -> String = {
      await MainActor.run { AssistantSettings.shared.transcriptionLanguage }
    },
    currentOwnerId: @escaping @Sendable () -> String? = { RuntimeOwnerIdentity.currentOwnerId() },
    now: @escaping @Sendable () -> Date = { Date() }
  ) {
    self.fetchPreferred = fetchPreferred
    self.fallbackLanguage = fallbackLanguage
    self.currentOwnerId = currentOwnerId
    self.now = now
  }

  /// The user's preferred language code, or nil when it is English or unknown.
  /// Cached per owner for `cacheLifetime`; falls back to the transcription language
  /// when the backend cannot be reached.
  func preferredLanguage() async -> String? {
    let ownerId = currentOwnerId()
    if let cached, cached.ownerId == ownerId, now().timeIntervalSince(cached.fetchedAt) < Self.cacheLifetime {
      return cached.language
    }

    let language: String?
    do {
      language = Self.nonEnglish(try await fetchPreferred())
    } catch {
      // Do not cache the fallback: the next call should retry the backend.
      return Self.nonEnglish(await fallbackLanguage())
    }
    cached = (ownerId, language, now())
    return language
  }

  /// Records a language the user just saved so assistants switch without waiting
  /// for the cache to expire.
  func record(_ language: String) {
    cached = (currentOwnerId(), Self.nonEnglish(language), now())
  }

  /// Prompt suffix for the user's preferred language, or nil when none is needed.
  func instruction() async -> String? {
    Self.instruction(for: await preferredLanguage())
  }

  nonisolated static func instruction(for code: String?) -> String? {
    guard let code = nonEnglish(code) else { return nil }
    let baseCode = AssistantSettings.baseLanguageCode(code)
    let name =
      AssistantSettings.supportedLanguages.first {
        AssistantSettings.baseLanguageCode($0.code) == baseCode
      }?.name ?? code
    return
      "IMPORTANT: Write all user-visible text (titles, descriptions, memories, advice) in \(name) (\(code)), "
      + "the user's preferred language. Keep names, app names, and quoted on-screen text as they appear."
  }

  nonisolated static func nonEnglish(_ code: String?) -> String? {
    guard let trimmed = code?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else {
      return nil
    }
    // "multi" is a transcription mode, not a language to write in.
    let base = AssistantSettings.baseLanguageCode(trimmed)
    return base == "en" || base == "multi" ? nil : trimmed
  }
}
