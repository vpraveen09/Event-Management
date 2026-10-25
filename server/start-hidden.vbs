' Launches the Event Management server silently (no console window).
' Used both for manual double-click startup and as the Windows Startup entry.
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\acer\Event Management\server"
WshShell.Run "node index.js", 0, False
