import XCTest

@testable import Omi_Computer

final class AssistantOutputLanguageTests: XCTestCase {
  private final class Fixture: @unchecked Sendable {
    private let lock = NSLock()
    private var _language = "es"
    private var _fails = false
    private var _fetches = 0
    private var _ownerId: String? = "owner-a"
    private var _now = Date(timeIntervalSince1970: 1_000_000)

    var language: String {
      get { lock.withLock { _language } }
      set { lock.withLock { _language = newValue } }
    }
    var fails: Bool {
      get { lock.withLock { _fails } }
      set { lock.withLock { _fails = newValue } }
    }
    var fetches: Int { lock.withLock { _fetches } }
    var ownerId: String? {
      get { lock.withLock { _ownerId } }
      set { lock.withLock { _ownerId = newValue } }
    }
    var now: Date {
      get { lock.withLock { _now } }
      set { lock.withLock { _now = newValue } }
    }

    func fetch() throws -> String {
      try lock.withLock {
        _fetches += 1
        if _fails { throw URLError(.notConnectedToInternet) }
        return _language
      }
    }
  }

  private func makeResolver(_ fixture: Fixture, fallback: String = "fr") -> AssistantOutputLanguage {
    AssistantOutputLanguage(
      fetchPreferred: { try fixture.fetch() },
      fallbackLanguage: { fallback },
      currentOwnerId: { fixture.ownerId },
      now: { fixture.now }
    )
  }

  func testInstructionNamesTheLanguageAndIsAbsentForEnglish() {
    let spanish = AssistantOutputLanguage.instruction(for: "es")
    XCTAssertNotNil(spanish)
    XCTAssertTrue(spanish?.contains("Spanish (es)") == true)

    XCTAssertNil(AssistantOutputLanguage.instruction(for: "en"))
    XCTAssertNil(AssistantOutputLanguage.instruction(for: "en-GB"))
    XCTAssertNil(AssistantOutputLanguage.instruction(for: "multi"))
    XCTAssertNil(AssistantOutputLanguage.instruction(for: "  "))
    XCTAssertNil(AssistantOutputLanguage.instruction(for: nil))
  }

  func testPreferredLanguageIsCachedPerOwner() async {
    let fixture = Fixture()
    let resolver = makeResolver(fixture)

    let first = await resolver.preferredLanguage()
    let second = await resolver.preferredLanguage()
    XCTAssertEqual(first, "es")
    XCTAssertEqual(second, "es")
    XCTAssertEqual(fixture.fetches, 1)

    fixture.ownerId = "owner-b"
    fixture.language = "de"
    let otherOwner = await resolver.preferredLanguage()
    XCTAssertEqual(otherOwner, "de")
    XCTAssertEqual(fixture.fetches, 2)
  }

  func testCacheExpiresAfterLifetime() async {
    let fixture = Fixture()
    let resolver = makeResolver(fixture)

    _ = await resolver.preferredLanguage()
    fixture.language = "pt-BR"
    fixture.now = fixture.now.addingTimeInterval(AssistantOutputLanguage.cacheLifetime + 1)

    let refreshed = await resolver.preferredLanguage()
    XCTAssertEqual(refreshed, "pt-BR")
    XCTAssertEqual(fixture.fetches, 2)
  }

  func testRecordedLanguageAppliesImmediately() async {
    let fixture = Fixture()
    let resolver = makeResolver(fixture)

    _ = await resolver.preferredLanguage()
    await resolver.record("en")

    let afterSwitchToEnglish = await resolver.preferredLanguage()
    XCTAssertNil(afterSwitchToEnglish)
    XCTAssertEqual(fixture.fetches, 1)
  }

  func testBackendFailureUsesFallbackWithoutCachingIt() async {
    let fixture = Fixture()
    fixture.fails = true
    let resolver = makeResolver(fixture, fallback: "it")

    let offline = await resolver.preferredLanguage()
    XCTAssertEqual(offline, "it")

    fixture.fails = false
    let online = await resolver.preferredLanguage()
    XCTAssertEqual(online, "es")
    XCTAssertEqual(fixture.fetches, 2)
  }
}
