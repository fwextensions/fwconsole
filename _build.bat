@echo off
REM other locales are de_DE, fr_FR, and ja_JP
REM SET OPTS=-use-network=false -library-path+=../../frameworks/locale/{locale} -source-path+=locale/{locale} -locale=en_US
REM SET OPTS=-use-network=true -output=C:\Projects\LCD Frame\Slideshow\resources\ImageDisplay.swf
REM SET OPTS=-use-network=true 

	rem use 200x150 as the default size of the swf, since the app's size is set to 100% in the mxml
SET OPTS=-use-network=true -warn-no-type-decl=false -library-path+=assets -library-path+=..\lib -source-path+=..\src -theme assets\Ice.css -keep-generated-actionscript=true -incremental=true -default-size 200 150

"C:\Software\Development\Flex\Flex 3\flex_sdk_3.0.0.477\bin\mxmlc" %OPTS% -output FireworksConsole.swf FireworksConsole.mxml

cp "FireworksConsole.swf" "C:\Program Files\Adobe\Adobe Fireworks CS5\Configuration\Command Panels\Fireworks Console.swf"
rem cp "FireworksConsole.swf" "C:\Program Files\Adobe\Adobe Fireworks CS4\Configuration\Command Panels\Fireworks Console.swf"
move "FireworksConsole.swf" "C:\Program Files\Adobe\Adobe Fireworks CS3\Configuration\Command Panels\Fireworks Console.swf"

rem pause
