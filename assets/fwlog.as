// ===========================================================================
//
//  fwlog.as
//
//  Copyright 2002 John Dunning.  All rights reserved.
//
//	fireworks@johndunning.com	http://johndunning.com/fireworks/
//
// ===========================================================================


/*

	Usage:

	The Fireworks Log helps developers of Fireworks SWF command panels, which
	are difficult to debug.  You generally can't run them effectively in Test
	Movie mode, because they assume they're running inside the Fireworks 
	environment.  You can pop up alert dialogs by calling the Fireworks
	alert() function through MMExecute(), but that's really awkward.

	The Fireworks Log solves the problem by providing a panel to which other
	commands can dump text.  It consists of two pieces: this ActionScript file 
	and the	command panel that runs inside Fireworks.  
	
	To use the log, install the Fireworks Log command in the 
	"Fireworks MX/Configuration/Command Panels" folder.  When you want to view 
	the log output, open the panel with	Window > johndunning > Fireworks Log.  

	The Fireworks Log panel provides a scrolling text area that displays the
	messages it receives from other Flash command panels.

	To connect your command panel to the log, include this file in your 
	Flash movie:

		#include "fwlog.as"

	To send a message to the log, call fwlog() with one or more values, 
	like this:

		fwlog("The meaning of life is ", 3 * 14);

	This will display "The meaning of life is, 42" in the Fireworks Log panel.
	You can pass as many values as you like to fwlog().

	To clear the log programmatically, call fwlog.clear().  You can also click
	the Clear button on the Fireworks Log panel itself.

	To disable all the fwlog() calls in your code, call fwlog.stopLogging() at
	the beginning of your Flash movie.

*/


// ===========================================================================
//  fwlog
// ===========================================================================
//
// Sends inMessage to the Fireworks Log panel

public function fwlog(
	...inMessages):void
{
	if (!isEnabled) {
			// logging is off, so ignore this call
		return;
	}
/*	
	if (arguments.length > 1) {
			// convert the arguments to strings, separated by a comma 
		inMessage = arguments.join(", ");
	}
*/	
	var message:String = inMessages.join(", ");

	lc.send("Fireworks Log", "LogMessage", message);
}


// ===========================================================================
//  Members
// ===========================================================================

	// default to logging on
internal var isEnabled:Boolean = true;

	// create a local connection to talk to the Fireworks Log panel
internal var lc:LocalConnection = new LocalConnection();


// ===========================================================================
//  stopLogging
// ===========================================================================
//
// Turns off logging, so subsequent calls to fwlog() are ignored.

public function stopLogging():void
{
	isEnabled = false;
}


// ===========================================================================
//  startLogging 
// ===========================================================================
//
// Turns logging on.

public function startLogging():void
{
	isEnabled = true;
}


// ===========================================================================
//  clear 
// ===========================================================================
//
// Clears the log.

public function clear():void
{
//	var lc = new LocalConnection();
	lc.send("Fireworks Log", "Clear");
//	fwlog.lc.send("Fireworks Log", "Clear");
}
