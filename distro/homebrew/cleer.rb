cask "cleer" do
  version "0.1.7"
  sha256 :no_check

  url "https://github.com/ayyesu/CLEER/releases/download/v#{version}/CLEER-#{version}-arm64.dmg",
      verified: "github.com/ayyesu/CLEER/"
  name "CLEER"
  desc "Computer Lifecycle, Efficiency & Environment Recovery — cross-platform disk space reclaimer"
  homepage "https://github.com/ayyesu/CLEER"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true

  app "CLEER.app"

  zap trash: [
    "~/Library/Application Support/CLEER",
    "~/Library/Caches/com.cleer.app",
    "~/Library/Logs/CLEER",
    "~/Library/Preferences/com.cleer.app.plist",
    "~/Library/Saved Application State/com.cleer.app.savedState",
  ]
end
