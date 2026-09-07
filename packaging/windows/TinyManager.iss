#ifndef AppVersion
  #define AppVersion "0.1.0-alpha.3"
#endif
#ifndef OutputDir
  #define OutputDir "..\..\release"
#endif

#define AppName "TinyManager"
#define AppPublisher "Webtanan"
#define AppURL "https://github.com/webtanan-sketch/tinymanager"
#define AppExeName "Start-TinyManager.ps1"

[Setup]
AppId={{C29DF713-A5DF-4D25-9F68-8FDCFF243CAF}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}/releases
DefaultDirName={localappdata}\Programs\TinyManager
DefaultGroupName=TinyManager
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir={#OutputDir}
OutputBaseFilename=TinyManager-Setup-v{#AppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayName=TinyManager
SetupLogging=yes
CloseApplications=no
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\..\dist\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "Start-TinyManager.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "Start-TinyManager.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "README-PORTABLE.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\TinyManager"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\Start-TinyManager.ps1"""; WorkingDir: "{app}"
Name: "{autodesktop}\TinyManager"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\Start-TinyManager.ps1"""; WorkingDir: "{app}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: checkedonce

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\Start-TinyManager.ps1"""; WorkingDir: "{app}"; Description: "Launch TinyManager"; Flags: postinstall nowait skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\app"
