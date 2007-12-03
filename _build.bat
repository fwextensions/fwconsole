@echo off
REM other locales are de_DE, fr_FR, and ja_JP
REM SET OPTS=-use-network=false -library-path+=../../frameworks/locale/{locale} -source-path+=locale/{locale} -locale=en_US
REM SET OPTS=-use-network=true -output=C:\Projects\LCD Frame\Slideshow\resources\ImageDisplay.swf
REM SET OPTS=-use-network=true 

SET OPTS=-use-network=true -library-path+=assets -library-path+=..\lib -source-path+=..\src -theme assets\Ice.css -keep-generated-actionscript=true  
rem SET OPTS=-use-network=true -library-path+=assets -theme "C:\Projects\Fireworks\Commands\Dev\FWConsole\assets\Ice.css" -strict=false -keep-generated-actionscript=true  

C:\Software\Development\Flex\flex2_sdk_hf1\bin\mxmlc %OPTS% -output FireworksConsole.swf FireworksConsole.mxml

cp "FireworksConsole.swf" "C:\Program Files\Adobe\Adobe Fireworks CS4\Configuration\Command Panels\Fireworks Console.swf"
move "FireworksConsole.swf" "C:\Program Files\Adobe\Adobe Fireworks CS3\Configuration\Command Panels\Fireworks Console.swf"

 pause
