/* ===========================================================================
	
	File: console.as

	Author - John Dunning
	Copyright - 2007 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.1.0 ($Revision: 1.1 $)
	Last update - $Date: 2007/12/02 00:23:06 $

   ======================================================================== */

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

package com.johndunning.fw {

	import flash.net.LocalConnection;


	// =======================================================================
    public class console
    {
		private static var lc:LocalConnection = new LocalConnection();
		
		
		// ===================================================================
		public static function log(
			...inMessages) : void
		{
/*			if (!isEnabled) {
					// logging is off, so ignore this call
				return;
			}
*/
			var message:String = inMessages.join(", ");
		
			lc.send("FireworksConsole", "log", message);
		}
		
		
		// ===================================================================
		public static function clear() : void
		{
			lc.send("FireworksConsole", "clear", null);
		}
    }

}
