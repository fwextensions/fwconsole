# Fireworks Console

This panel provides a poor man's Firebug-esque console to Adobe Fireworks, which aids in the debugging of extensions written in JavaScript.  See the [Fireworks Console page](http://johndunning.com/fireworks/about/FWConsole) for a full description of the functionality it offers.  Unless you want to modify the console itself, it's easiest to just download the .mxp file from that page, which includes the compiled .swf.

The console panel is a combination of AS3/Flex 3 for the UI and a JavaScript library for interacting with the JS environment in Fireworks.  The AS3 code loads the JS code when the panel is first opened, which sets up a global `console` object in the JS environment.  The JS is included in the .swf as a long string, so there are no additional external files needed.  


## Building the source

The `_build.bat` file is a brain-dead little batch script for building the panel.  You'll need to change the paths to wherever your copy of the Flex 3 compiler is.  The compiler needs to be build 477, which seems to be the last version which correctly handled events from Fireworks.  The batch file is for Windows, but could be easily adapted to OS X.

You'll also need a copy of `as3corelib.swc`, which the console uses for handling JSON sent from the JS environment.  The library can be downloaded from [GitHub](https://github.com/mikechambers/as3corelib/downloads).

And you'll need a copy of my [`trace`](https://github.com/fwextensions/trace) repo at the same level as the console repo.  The `trace.js` file is embedded into the .swf during the build.
