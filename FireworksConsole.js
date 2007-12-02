/* ===========================================================================
	
	File: FireworksConsole.js

	Author - John Dunning
	Copyright - 2007 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.0 ($Revision$)
	Last update - $Date$

   ======================================================================== */


/*
  
	To do:
			
*/

  
jdlib = jdlib || {};


// ===========================================================================
jdlib.FireworksConsole = (function()
{
	function evaluateCode(
		inCode)
	{
		var dom = fw.getDocumentDOM();
		var sel = fw.selection;
		var __e__;
		var __r__;
		
		try {
			__r__ = StringFormatter.format(eval(inCode));
		} catch (__e__) {
			__r__ = __e__.toString();
		}
		
		return __r__;
	}


	var StringFormatter = {
		format: function(
			inValue,
			inDepth)
		{
			var valueType = typeof inValue;
			
			if (this[valueType]) {
				return this[valueType](inValue, inDepth);
			} else {
				return "UNKNOWN";
			}
		},
		
		
		"array": function(
			inArray,
			inDepth)
		{
			inDepth = inDepth || 0;
			var items = [];
		
			for (var i = 0, len = inArray.length; i < len; i++) {
				items.push(this.format(inArray[i], inDepth + 1));
			}
		
			return "[" + items.join(", ") + "]";
		},
		
		
		"object": function(
			inObject,
			inDepth,
			inAttributes)
		{
			inDepth = inDepth || 0;
			
			if (inObject == null) {
				return "null";
			} else if (inObject instanceof Array || inObject.toString() == "[object FwArray]") {
				return this["array"](inObject, inDepth);
			} else if (typeof inObject.__repr__ == "function") {
				return inObject.__repr__();
			}

			var emptyObject = {};
			var keys = [];
		
			if (typeof inAttributes == "undefined") {
				try {
					for (var attribute in inObject) {
						if (!(attribute in emptyObject)) {
							keys.push(attribute);
						}
					}
				} catch (exception) {
				}
		
				keys.sort();
			} else {
				keys = inAttributes;
			}
		
			if (keys.length == 0) {
					// don't waste 3 lines on an empty object
				return "{ }";
			}
		
			var attributes = [];
		
			for (var i = 0, len = keys.length; i < len; i++) {
				var key = keys[i];
				if (key != "javascriptString") {
					attributes.push(key + ": " + this.format(inObject[key], inDepth + 1));
				}
			}
			
			var tabs = "\t";
			while (inDepth-- > 0) { tabs += "\t"; }
			
			if (attributes.length < 5) {
				var result = "{ " + attributes.join(", ") + " }";
			} else {
				var result = ["{\n", tabs, attributes.join(",\n" + tabs), "\n", tabs.slice(1), "}"].join("");
			}
			
			return result;
		},
		
		
		"string": function(
			inString)
		{
			return '"' + inString + '"';
		},
		
		
		"number": function(
			inNumber)
		{
			return inNumber.toString();
		},
		
		
		"boolean": function(
			inBoolean)
		{
			return inBoolean.toString();
		},
		
		
		"function": function(
			inFunction)
		{
			return "function() {...}";
		},
		
		
		"undefined": function()
		{
			return "undefined";
		}
	};

	
	return {
		version: "$Revision$".match(/ ([0-9.]+) /)[1],
		evaluateCode: evaluateCode
	};
})();
