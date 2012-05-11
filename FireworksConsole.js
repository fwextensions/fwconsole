/* ===========================================================================
	
	File: FireworksConsole.js

	Author - John Dunning
	Copyright - 2012 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.4.0 ($Revision: 1.8 $)
	Last update - $Date: 2010/05/11 19:42:17 $

   ======================================================================== */


/*
	To do:
		- add functions for isRectangle, isText, etc. 

		- put the eval call in a separate anonymous function that only has 
			access to _ and the vars it defines
			so don't have to call it __StringFormatter__
			return the eval result to another function that formats the string

		- put trace on console.trace()?

		- maybe pass in a func callback, and console will unwatch when the 
			func returns, call console.unwatchAll()

		- support %s in first string passed to console.log, etc.

		- check for loops and for root object so we don't keel over when 
			typing dojo into the console 

		- support assert lambda strings
			would have to assert the expresion in the caller's context
			could walk the parent contexts like in trace
			http://v0.joehewitt.com/software/firebug/docs.php

		- eval the script in a with ({}) block so that created vars go on that
			object, instead of the global context 
			setting an undefined var doesn't add a property to the object
				goes right to the global context

	Done:
		- support assert() methods

		- add console.watch()
			console.watch([[o, "foo"], [o, "bar"])
			console.watch([[o, ["foo", "bar]], [p, "baz"])
			maybe a way to specify the string to show when the value changes
			need some way to tell the console what the name of the object is

		- way to clear the console

		- add keys(), forEach(), etc. to the eval'd script, console.dir

		- add way to count without displaying, and then display the total later
			console.count("foo", true);
			console.countDisplay("foo");

		- use dojo instead of JSON to avoid changing prototypes

		- push strings onto array rather than append to a string?
			should be faster
			can't do it because can't return the sring from a method called by the AS?

		- add console.log() API
*/

  
jdlib = jdlib || {};


// ===========================================================================
(function()
{
	var __StringFormatter__ = {
		format: function(
			inValue,
			inDepth)
		{
			var valueType = typeof inValue;

			if (inDepth > 10) {
				return "<< MAX DEPTH REACHED >>";
			} else if (this[valueType]) {
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

			var emptyObject = {},
				keys = [];
		
			if (typeof inAttributes == "undefined") {
				try {
					for (var attribute in inObject) {
						if (!(attribute in emptyObject)) {
							keys.push(attribute);
						}
					}
				} catch (exception) { }
		
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

					// skip javascriptString, since it's a string representation
					// of the object, which we're building ourselves.  also skip
					// pathOperation, which throws an exception if you just 
					// look at it funny.
				if (key != "javascriptString" && key != "pathOperation") {
					attributes.push(key + ": " + this.format(inObject[key], inDepth + 1));
				}
			}
			
			var tabs = "\t",
				result;
				
			while (inDepth-- > 0) { tabs += "\t"; }
			
			if (attributes.length < 5) {
				result = "{ " + attributes.join(", ") + " }";
			} else {
				result = ["{\n", tabs, attributes.join(",\n" + tabs), "\n", tabs.slice(1), "}"].join("");
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


	var _ = (function() {
		// these functions are pulled from the Underscore.js library and slightly
		// modified to handle the quirks of FW's JS engine.
		// 
		//     Underscore.js 1.3.1
		//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
		//     Underscore is freely distributable under the MIT license.
		//     Portions of Underscore are inspired or borrowed from Prototype,
		//     Oliver Steele's Functional, and John Resig's Micro-Templating.
		//     For all details and documentation:
		//     http://documentcloud.github.com/underscore

		  // Establish the object that gets returned to break out of a loop iteration.
		  var breaker = {};
		  
		  // set up the local _ object that we'll return when done
		  var _ = {};

		  // Save bytes in the minified (but not gzipped) version:
		  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

		  // Create quick reference variables for speed access to core prototypes.
		  var slice            = ArrayProto.slice,
			  unshift          = ArrayProto.unshift,
			  toString         = ObjProto.toString,
			  hasOwnProperty   = ObjProto.hasOwnProperty;

		  // The cornerstone, an `each` implementation, aka `forEach`.
		  // Handles objects with the built-in `forEach`, arrays, and raw objects.
		  // Delegates to **ECMAScript 5**'s native `forEach` if available.
		  var each = _.each = _.forEach = function(obj, iterator, context) {
			if (obj == null) return;
			if (obj.length === +obj.length) {
			  for (var i = 0, l = obj.length; i < l; i++) {
				  // we can't check "if i in obj" because it doesn't work with FwArray.
				  // 0 in fw.selection is false, even though there's an element selected.
				if (iterator.call(context, obj[i], i, obj) === breaker) return;
			  }
			} else {
			  for (var key in obj) {
				  if (iterator.call(context, obj[key], key, obj) === breaker) return;
			  }
			}
		  };

		  // Return the results of applying the iterator to each element.
		  // Delegates to **ECMAScript 5**'s native `map` if available.
		  _.map = _.collect = function(obj, iterator, context) {
			var results = [];
			if (obj == null) return results;
			each(obj, function(value, index, list) {
			  results[results.length] = iterator.call(context, value, index, list);
			});
			if (obj.length === +obj.length) results.length = obj.length;
			return results;
		  };

		  // Return the first value which passes a truth test. Aliased as `detect`.
		  _.find = _.detect = function(obj, iterator, context) {
			var result;
			any(obj, function(value, index, list) {
			  if (iterator.call(context, value, index, list)) {
				result = value;
				return true;
			  }
			});
			return result;
		  };

		  // Return all the elements that pass a truth test.
		  // Delegates to **ECMAScript 5**'s native `filter` if available.
		  // Aliased as `select`.
		  _.filter = _.select = function(obj, iterator, context) {
			var results = [];
			if (obj == null) return results;
			each(obj, function(value, index, list) {
			  if (iterator.call(context, value, index, list)) results[results.length] = value;
			});
			return results;
		  };

		  // Return all the elements for which a truth test fails.
		  _.reject = function(obj, iterator, context) {
			var results = [];
			if (obj == null) return results;
			each(obj, function(value, index, list) {
			  if (!iterator.call(context, value, index, list)) results[results.length] = value;
			});
			return results;
		  };

		  // Determine whether all of the elements match a truth test.
		  // Delegates to **ECMAScript 5**'s native `every` if available.
		  // Aliased as `all`.
		  _.every = _.all = function(obj, iterator, context) {
			var result = true;
			if (obj == null) return result;
			each(obj, function(value, index, list) {
			  if (!(result = result && iterator.call(context, value, index, list))) return breaker;
			});
			return result;
		  };

		  // Determine if at least one element in the object matches a truth test.
		  // Delegates to **ECMAScript 5**'s native `some` if available.
		  // Aliased as `any`.
		  var any = _.some = _.any = function(obj, iterator, context) {
			iterator || (iterator = _.identity);
			var result = false;
			if (obj == null) return result;
			each(obj, function(value, index, list) {
			  if (result || (result = iterator.call(context, value, index, list))) return breaker;
			});
			return !!result;
		  };

		  // Determine if a given value is included in the array or object using `===`.
		  // Aliased as `contains`.
		  _.include = _.contains = function(obj, target) {
			var found = false;
			if (obj == null) return found;
			found = any(obj, function(value) {
			  return value === target;
			});
			return found;
		  };

		  // Invoke a method (with arguments) on every item in a collection.
		  _.invoke = function(obj, method) {
			var args = slice.call(arguments, 2);
			return _.map(obj, function(value) {
			  return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
			});
		  };

		  // Convenience version of a common use case of `map`: fetching a property.
		  _.pluck = function(obj, key) {
			return _.map(obj, function(value){ 
				return value[key]; 
			});
		  };

		  // Return the maximum element or (element-based computation).
		  _.max = function(obj, iterator, context) {
			if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
			if (!iterator && _.isEmpty(obj)) return -Infinity;
			var result = {computed : -Infinity};
			each(obj, function(value, index, list) {
			  var computed = iterator ? iterator.call(context, value, index, list) : value;
			  computed >= result.computed && (result = {value : value, computed : computed});
			});
			return result.value;
		  };

		  // Return the minimum element (or element-based computation).
		  _.min = function(obj, iterator, context) {
			if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
			if (!iterator && _.isEmpty(obj)) return Infinity;
			var result = {computed : Infinity};
			each(obj, function(value, index, list) {
			  var computed = iterator ? iterator.call(context, value, index, list) : value;
			  computed < result.computed && (result = {value : value, computed : computed});
			});
			return result.value;
		  };

		  // Sort the object's values by a criterion produced by an iterator.
		  _.sortBy = function(obj, iterator, context) {
			return _.pluck(_.map(obj, function(value, index, list) {
			  return {
				value : value,
				criteria : iterator.call(context, value, index, list)
			  };
			}).sort(function(left, right) {
			  var a = left.criteria, b = right.criteria;
			  return a < b ? -1 : a > b ? 1 : 0;
			}), 'value');
		  };

		  // Groups the object's values by a criterion. Pass either a string attribute
		  // to group by, or a function that returns the criterion.
		  _.groupBy = function(obj, val) {
			var result = {};
			var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
			each(obj, function(value, index) {
			  var key = iterator(value, index);
			  (result[key] || (result[key] = [])).push(value);
			});
			return result;
		  };

		  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
		  // we need this function. Return the position of the first occurrence of an
		  // item in an array, or -1 if the item is not included in the array.
		  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
		  // If the array is large and already in sort order, pass `true`
		  // for **isSorted** to use binary search.
		  _.indexOf = function(array, item, isSorted) {
			if (array == null) return -1;
			var i, l;
			if (isSorted) {
			  i = _.sortedIndex(array, item);
			  return array[i] === item ? i : -1;
			}
			for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
			return -1;
		  };

		  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
		  _.lastIndexOf = function(array, item) {
			if (array == null) return -1;
			var i = array.length;
			while (i--) if (i in array && array[i] === item) return i;
			return -1;
		  };

		  // Retrieve the names of an object's properties.
		  // Delegates to **ECMAScript 5**'s native `Object.keys`
		  _.keys = function(obj, dontSort) {
			if (obj !== Object(obj)) throw new TypeError('Invalid object');
			var keys = [];
				// use in instead of hasOwnProperty because the latter doesn't seem to
				// work on native elements 
			for (var key in obj) if (key in obj, key) keys[keys.length] = key;

			if (!dontSort) {
				keys.sort();
			}

			return keys;
		  };

		  // Retrieve the values of an object's properties.
		  _.values = function(obj) {
			return _.map(obj, _.identity);
		  };

		  // Return a sorted list of the function names available on the object.
		  // Aliased as `methods`
		  _.functions = _.methods = function(obj) {
			var names = [];
			for (var key in obj) {
			  if (_.isFunction(obj[key])) names.push(key);
			}
			return names.sort();
		  };

		  _.has = function(obj, key) {
			return hasOwnProperty.call(obj, key);
		  };

		  // Is a given array, string, or object empty?
		  // An "empty" object has no enumerable own-properties.
		  _.isEmpty = function(obj) {
			if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
			for (var key in obj) if (_.has(obj, key)) return false;
			return true;
		  };

		  // Is a given value an array?
		  // Delegates to ECMA5's native Array.isArray
		  _.isArray = function(obj) {
			return toString.call(obj) == '[object Array]';
		  };

		  // Is a given variable an object?
		  _.isObject = function(obj) {
			return obj === Object(obj);
		  };

		  // Is a given variable an arguments object?
		  _.isArguments = function(obj) {
			return toString.call(obj) == '[object Arguments]';
		  };
		  if (!_.isArguments(arguments)) {
			_.isArguments = function(obj) {
			  return !!(obj && _.has(obj, 'callee'));
			};
		  }

		  // Is a given value a function?
		  _.isFunction = function(obj) {
			return toString.call(obj) == '[object Function]';
		  };

		  // Is a given value a string?
		  _.isString = function(obj) {
			return toString.call(obj) == '[object String]';
		  };

		  // Is a given value a number?
		  _.isNumber = function(obj) {
			return toString.call(obj) == '[object Number]';
		  };

		  // Is the given value `NaN`?
		  _.isNaN = function(obj) {
			// `NaN` is the only value for which `===` is not reflexive.
			return obj !== obj;
		  };

		  // Is a given value a boolean?
		  _.isBoolean = function(obj) {
			return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
		  };

		  // Is a given value a date?
		  _.isDate = function(obj) {
			return toString.call(obj) == '[object Date]';
		  };

		  // Is the given value a regular expression?
		  _.isRegExp = function(obj) {
			return toString.call(obj) == '[object RegExp]';
		  };

		  // Is a given value equal to null?
		  _.isNull = function(obj) {
			return obj === null;
		  };

		  // Is a given variable undefined?
		  _.isUndefined = function(obj) {
			return obj === void 0;
		  };

		  // Keep the identity function around for default iterators.
		  _.identity = function(value) {
			return value;
		  };

		  // Safely convert anything iterable into a real, live array.
		  _.toArray = function(iterable) {
			if (!iterable)                return [];
			if (iterable.toArray)         return iterable.toArray();
			if (_.isArray(iterable))      return slice.call(iterable);
			if (_.isArguments(iterable))  return slice.call(iterable);
			return _.values(iterable);
		  };

		  return _;
	})();


	var dojo = (function() {
			// embed a local copy of the dojo JSON library, which has been changed
			// to not depend on any other part of dojo.  that way, we don't have to
			// rely on external libraries.  unlike Crockford's library, the dojo
			// implementation doesn't change the prototypes of basic types, which
			// caused problems for the Path panel, and possibly others.
		var dojo = {};

		dojo.fromJson = function(/*String*/ json){
			return eval("(" + json + ")"); // Object
		}

		dojo._escapeString = function(/*String*/str){
			return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
				replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
				replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r"); // string
		}

		dojo.toJsonIndentStr = "\t";
		dojo.toJson = function(/*Object*/ it, /*Boolean?*/ prettyPrint, /*String?*/ _indentStr){
			if(it === undefined){
					// dojo was incorrectly returning "undefined" here
				return undefined;
			}
			var objtype = typeof it;
			if(objtype == "number" || objtype == "boolean"){
				return it + "";
			}
			if(it === null){
				return "null";
			}
			if(typeof it == "string" || it instanceof String){
				return dojo._escapeString(it);
			}
			// recurse
			var recurse = arguments.callee;
			// short-circuit for objects that support "json" serialization
			// if they return "self" then just pass-through...
			var newObj;
			_indentStr = _indentStr || "";
			var nextIndent = prettyPrint ? _indentStr + dojo.toJsonIndentStr : "";
			var tf = it.__json__||it.json;
			if(typeof tf == "function"){
				newObj = tf.call(it);
				if(it !== newObj){
					return recurse(newObj, prettyPrint, nextIndent);
				}
			}
			if(it.nodeType && it.cloneNode){ // isNode
				// we can't seriailize DOM nodes as regular objects because they have cycles
				// DOM nodes could be serialized with something like outerHTML, but
				// that can be provided by users in the form of .json or .__json__ function.
				throw new Error("Can't serialize DOM nodes");
			}

			var sep = prettyPrint ? " " : "";
			var newLine = prettyPrint ? "\n" : "";

			// array
			if(it && it instanceof Array){
				var res = [];
				for (var i = 0, len = it.length; i < len; i++) {
					var val = recurse(it[i], prettyPrint, nextIndent);
					if(typeof val != "string"){
							// dojo was incorrectly returning "undefined" here
						val = undefined;
					}
					res[i] = newLine + nextIndent + val;
				}
				return "[" + res.join("," + sep) + newLine + _indentStr + "]";
			}
			if(objtype == "function"){
				return null; // null
			}
			// generic object code path
			var output = [], key;
			for(key in it){
				var keyStr, val;
				if(typeof key == "number"){
					keyStr = '"' + key + '"';
				}else if(typeof key == "string"){
					keyStr = dojo._escapeString(key);
				}else{
					// skip non-string or number keys
					continue;
				}
				val = recurse(it[key], prettyPrint, nextIndent);
				if(typeof val != "string"){
					// skip non-serializable values
					continue;
				}
				// FIXME: use += on Moz!!
				//	 MOW NOTE: using += is a pain because you have to account for the dangling comma...
				output.push(newLine + nextIndent + keyStr + ":" + sep + val);
			}
			return "{" + output.join("," + sep) + newLine + _indentStr + "}"; // String
		}
		
		return dojo;
	})();
	

	// =======================================================================
	function useDojo()
	{
		if (typeof dojo == "undefined") { fw.runScript("lib/dojo/dojo.js"); }
	}

	
	// =======================================================================
	function now()
	{
		return (new Date()).getTime();
	}


	// =======================================================================
	function addLogEntry(
		inType,
		inCaller)
	{
		if (arguments.length < 3) {
			return;
		}
		
		inCaller = inCaller || {};

		var s = [],
			callerName = inCaller.name || "anonymous";
		
		for (var i = 2, len = arguments.length; i < len; i++) {
			var variant = arguments[i];

			if (typeof variant == "string") {
					// we don't use the string StringFormatter here because we don't
					// want double quotes around strings when calling log("here's a string");
				s.push(variant);
			} else {
				s.push(__StringFormatter__.format(variant));
			}
		}
		
		if (_showStack) {
			var callers = [];
				
				// follow the call stack, up to 5 deep, in case we run into a loop
			for (var depth = 0, fn = inCaller.caller; depth < 5 && fn; depth++, fn = fn.caller) {
				callers.push(fn.name || "anonymous");
			}
			
			if (callers.length) {
					// we walked the stack from bottom to top, but we want to 
					// display the calls from top to bottom
				callers.reverse();
				callerName = callers.join(" > ") + " > " + callerName;
			}
		}

			// due to the annoying-as-fuck modal "processing command" dialog that
			// will appear on top of FW and require a force-quit if the call stack
			// gets more than one or two levels deep, we can't delay the conversion
			// of the log entries to JSON until the console polls for the latest
			// entries.  so we have to convert the parameters to a JSON string
			// now, and push the string onto an array.  ffs.
		console._logEntries.push(dojo.toJson({
			type: inType,
			text: s.join(" "),
			caller: callerName,
			time: now()
		}));

			// keep only the last 50 log entries, in case the console panel
			// isn't picking them up
		console._logEntries = console._logEntries.slice(-50);
	}


	var _counts = {},
		_timers = {},
		_watches = [],
		_showStack = false;
	
	
		// create the console global
	console = {
			// we need to set this so dojo doesn't wipe out the console object
			// if it loads after us
		firebug: true,

			// this array stores the JSON strings until the panel wants them
		_logEntries: [],
		
			// this string temporarily holds the JSON string version of the
			// _logEntries array
		_logEntriesJSON: "",
		
		
			// the clear() method sets this to true to let the panel know to 
			// clear the log display
		_clearLog: false,
		
		
			// provide access to the raw addLogEntry so object watchers can 
			// pass their caller
		_addLogEntry: addLogEntry,
		
		
		// ===================================================================
		_prepLogEntriesJSON: function()
		{
			var entries = this._logEntries;

				// clear the array, so that we don't redisplay old entries
			this._logEntries = [];

				// convert the array to JSON and store it on a property of
				// console.  due to the motherless-whore processing dialog, we
				// can't simply return this string to the panel.  instead, the
				// panel has to call this method and then access
				// console._logEntriesJSON to get the JSON string.
			this._logEntriesJSON = "[" + entries.join(",") + "]";
		},
		
		
		// ===================================================================
		evaluate: function(
			inCode)
		{
			var dom = fw.getDocumentDOM(),
				sel = fw.selection,
				el = fw.selection[0],
				global = (function() { return this; })(),
				__e__,
				__r__;

			try {
					// eval the code in the context of the underscore library, so
					// the code can use keys(), pluck(), etc. 
				with (_) {
					__r__ = __StringFormatter__.format(eval(inCode));
				}
			} catch (__e__) {
				__r__ = __e__.toString();
			}

			return __r__;
		},


		// ===================================================================
		time: function(
			inTimerName)
		{
			_timers[inTimerName] = now()
		},


		// ===================================================================
		timeEnd: function(
			inTimerName)
		{
			if (_timers[inTimerName]) {
				var delta = now() - _timers[inTimerName],
					unit = "ms";
					
				if (delta >= 1000) {
					unit = "sec";
					delta /= 1000;
				}
				
				addLogEntry("log", arguments.callee.caller, inTimerName + ":", delta, unit);
				delete _timers[inTimerName];
			}
		},


		// ===================================================================
		count: function(
			inCountName,
			inSuppressDisplay)
		{
			if (!_counts[inCountName]) {
				_counts[inCountName] = 0;
			}

			_counts[inCountName]++;

			if (!inSuppressDisplay) {
				addLogEntry("log", arguments.callee.caller, inCountName + ":", _counts[inCountName]);
			}
		},


		// ===================================================================
		countDisplay: function(
			inCountName,
			inReset)
		{
			if (_counts[inCountName]) {
				addLogEntry("log", arguments.callee.caller, inCountName + ":", _counts[inCountName]);

				if (inReset) {
					delete _counts[inCountName];
				}
			}
		},


		// ===================================================================
		countReset: function(
			inCountName)
		{
			delete _counts[inCountName];
		},


		// ===================================================================
		dir: function(
			inObject,
			inMessage)
		{
			inMessage = inMessage ? inMessage + ": " : "";
			
				// we need to call StringFormatter ourselves, since if we 
				// passed inMessage as a separate parameter, there'd be an extra
				// space in the log if inMessage was empty
			addLogEntry.apply(this, ["log", arguments.callee.caller, 
				inMessage + __StringFormatter__.format(_.keys(inObject))]);
		},


		// ===================================================================
		assert: function(
			inAssertion,
			inMessage)
		{
			if (!inAssertion) {
				addLogEntry.apply(this, ["error", arguments.callee.caller, 
					"ASSERTION FAILED:"].concat(_.toArray(arguments).slice(1)));
			}
		},


		// ===================================================================
		watch: function(
			inObject,
			inProperties,
			inObjectName)
		{
			if (inObject === null) {
				return;
			}
			
			if (!inProperties || inProperties == "*") {
					// the caller wants to watch all the properties on the object
				inProperties = _.keys(inObject);
			}
			
				// turn inProperties into an array if it's just a single string
				// so we can run it through forEach below
			inProperties = _.isArray(inProperties) ? inProperties : [inProperties];
			
			var objectName = inObjectName ? (inObjectName + ".") : "",
					// annoyingly, callbacks used for watching don't seem to
					// have any closure scope at all.  they can only access 
					// local vars and literals.  since we want to include an
					// optional object name in the log call, we have to build
					// the callback as a string and then call Function().  
					// instead of calling log(), call the lower-level 
					// _addLogEntry so we can pass the watch callback's caller,
					// which lets the console display its name.
				callback = Function("inName", "inOldValue", "inNewValue",
					'console._addLogEntry("log", arguments.callee.caller, ' + 
					objectName.quote() + ' + inName + ":", inOldValue, "=>", inNewValue);' + 
					'return inNewValue;'
				);
					
			_.forEach(inProperties, function(property) {
					// remember the watched object so we can unwatch it
				_watches.push({
					object: inObject,
					property: property
				});

				inObject.watch(property, callback);
			});
		},


		// ===================================================================
		unwatch: function(
			inObject,
			inProperties)
		{
			if (inObject === null) {
				return;
			}
			
			if (!inProperties || inProperties == "*") {
					// the caller wants to unwatch all the properties on the object
				inProperties = _.keys(inObject);
			}
			
				// turn inProperties into an array if it's just a single string
				// so we can run it through forEach below
			inProperties = _.isArray(inProperties) ? inProperties : [inProperties];
			
			_.forEach(inProperties, function(property) {
					// look for the watch object corresponding to this property
					// and object in _watches
				for (var i = 0, len = _watches.length; i < len; i++) {
					var watch = _watches[i];

					if (watch.object === inObject && watch.property == property) {
							// delete this watch object since we're going to 
							// unwatch the property
						_watches.splice(i, 1);
						break;
					}
				}
				
					// regardless of whether the watch was found, we can unwatch
					// the property 
				inObject.unwatch(property);
			});
		},
		
		
		// ===================================================================
		unwatchAll: function()
		{
			_.forEach(_watches, function(watch) {
				if (watch.object) {
						// it doesn't seem to matter if we unwatch a property
						// that doesn't exist on the object
					watch.object.unwatch(watch.property);
				}
			});
			
				// clear the list now that we've unwatched everything
			_watches =[];
		},
		

		// ===================================================================
		showStack: function(
			inMessage)
		{
			var stack = [],
				name,
				call,
				callKeys,
				params, 
				paramName,
				paramValue,
				paramString,
				match;
				
				// follow the call stack, up to 5 deep, in case we run into a 
				// recursive function, which causes a loop in the caller chain 
			for (var depth = 0, fn = arguments.callee.caller; depth < 5 && fn; depth++, fn = fn.caller) {
				name = fn.name || "anonymous";
				call = fn.__call__;
					// we want the keys in their natural order, not sorted
				callKeys = _.keys(call, true);
				params = [];

					// we assume that the enumeration order of the properties
					// on __call__ is the same as the source order of the params
					// and local vars, which seems to be true
				for (var i = 0, len = fn.arity; i < len; i++) {
					paramName = callKeys[i];
					paramValue = call[paramName];

					if (paramValue instanceof Array) {
						paramString = "Array";
					} else if (typeof paramValue == "string") {
						paramString = paramValue.quote();
					} else {
							// don't call .toString() so that we can get a string
							// representation of things like null
						paramString = paramValue + "";
						match = paramString.match(/^\[object (\w+)\]$/);
						
						if (match) {
								// extract the name of the type from the string
							paramString = match[1];
						}
					}
					
					params.push(paramName + ": " + paramString);
				}
				
					// display one call per line 
				stack.push(name + "(" + params.join(", ") + ")");
			}
			
			inMessage = inMessage ? " [" + inMessage + "]" : "";
			stack.push("Call stack" + inMessage + ":");
			
				// we walked the stack from bottom to top, but we want to 
				// display the calls from top to bottom.  show "Call stack:"
				// before the list of calls.
			stack.reverse();
			
			stack = _.map(stack, function(item, i) {
				var spaces = [];
				spaces.length = i * 2 + 1;
				
				return spaces.join(" ") + item;
			});
			
				// push the stack information directly onto the log array so
				// that we can control the caller string
			this._logEntries.push(dojo.toJson({
				type: "log",
				text: stack.join("\n"),
				caller: "",
				time: now()
			}));
		},


		// ===================================================================
		showStackPrefix: function(
			inEnabled)
		{
			_showStack = inEnabled;
		},


		// ===================================================================
		clear: function()
		{
			this._logEntries = [];
			this._logEntriesJSON = "";
			this._clearLog = true;
		}
	};


		// create functions that pass different types to addLogEntry
	for (var functionName in { log:1, warn:1, info:1, debug:1, error:1 }) {
		console[functionName] = (function(inFunctionName) {
			return function()
				{
						// pass our caller in so that addLogEntry can extract
						// its name
					addLogEntry.apply(this, [inFunctionName, arguments.callee.caller].concat(arguments));
				};
		})(functionName);
	}

		// create functions that print error messages for unsupported methods
	for (var functionName in { trace:1, dirxml:1, group:1, groupEnd:1, profile:1, profileEnd:1 }) {
		console[functionName] = (function(inFunctionName) {
			return function() { console.error("*** console." + inFunctionName + "() is not currently supported ***"); };
		})(functionName);
	}

	log = console.log;
})();
