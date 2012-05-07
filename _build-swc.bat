@echo off
SET OPTS=-use-network=true -library-path+=assets -library-path+=..\lib -source-path+=..\src -theme assets\Ice.css -keep-generated-actionscript=true -incremental=true -default-size 200 150

"C:\Software\Development\Flex\Flex 3\flex_sdk_3.0.0.477\bin\compc" %OPTS% -output ..\lib\console.swc -include-classes com.johndunning.fw.console

rem -include-sources FV_classes/FV_format.as FV_classes/FV_calc.as 
