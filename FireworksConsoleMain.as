/* ===========================================================================
	
	File: FireworksConsoleMain.as

	Author - John Dunning
	Copyright - 2007 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.0 ($Revision$)
	Last update - $Date$

   ======================================================================== */


import flash.events.*;
import flash.net.LocalConnection;
import flash.net.SharedObject;
import flash.ui.Keyboard;
import mx.controls.TextArea;
//import mx.collections.*;
import adobe.utils.*;
//import FireworksConsoleApp;


include "assets/fwlog.as";


private var prefs:SharedObject = SharedObject.getLocal("FWConsolePrefs");
private var inputArea:TextArea;
private var outputArea:TextArea;

  
// ===========================================================================
private function main() : void 
{
	inputArea = Input;
	outputArea = Output;
	
	inputArea.addEventListener(KeyboardEvent.KEY_UP, onInputKeyUp, false, 0, true);
//	inputArea.addEventListener(KeyboardEvent.KEY_DOWN, onInputKeyDown, true, 1000000, true);
//	inputArea.addEventListener(KeyboardEvent.KEY_DOWN, onInputKeyDown, false, 0, true);
	inputArea.setFocus();
	
	outputArea.text = prefs.data.savedOutput || "";
}


// ===========================================================================
private function evaluateCode() : void
{
try {
	var code = inputArea.text.slice(0, -1);
fwlog(code + "||");
	var result = MMExecute(code);
	print(">>> " + code + ": " + result + "\n");
//	outputArea.text = result;
	inputArea.text = "dammit";
fwlog("inputArea", inputArea.text, "ffs");
	inputArea.text = "";
//fwlog("inputArea", inputArea.text, );
} catch (e:*) {
fwlog(e.message);
}
}


// ===========================================================================
private function print(
	inText:String) : void
{
	outputArea.text += inText;
	outputArea.validateNow();
	outputArea.verticalScrollPosition = outputArea.maxVerticalScrollPosition;
}


// ===========================================================================
private function onInputKeyUp(
//private function onInputKeyDown(
	inEvent:KeyboardEvent) : void
{
	switch (inEvent.keyCode) {
		case Keyboard.ENTER:
			if (inEvent.ctrlKey) {
			} else {
				evaluateCode();
//				inEvent.preventDefault();
//				inEvent.stopPropagation();
			}
			break;
			
		case Keyboard.UP:
		case Keyboard.DOWN:
//			if 
			break;
	}
}
