/* ===========================================================================

	FireworksConsole.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


/*
	To do:
		- the real console.trace does a live version of showStack
			change the name?

		- add checkbox for saving log to file in panel and pass setting to JS

		- maybe accessing a getter on the console wouldn't cause the processing
			dialog, and it could return the stringified JSON

		- support console.group to make it easier to see the call flow
			but maybe the stack prefix is enough

		- indicate that log was called from the global scope, outside a function

		- maybe have option to prefix logs with name of JS file
			only works up to the first runScript in a file

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
		- setting dojo to null in an eval'd script sets it to null in the
			scope of the console, breaking log()

		- put the eval call in a separate anonymous function that only has
			access to _ and the vars it defines
			so don't have to call it __StringFormatter__
			return the eval result to another function that formats the string

		- save log file wherever the panel actually is

		- clear the log file when Clear is clicked in the panel

		- also save result of eval to log file?

		- pass true to clear() to keep a timestamped copy of the .txt file around

		- add functions for isRectangle, isText, etc.

		- show just anon() in the stack prefix, so it's more compact
			or maybe just main() > () > ()

		- support logging arguments

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


// ===========================================================================
(function(
	evaluate)
{
	// =======================================================================
	function now()
	{
		return (new Date()).getTime();
	}


	// =======================================================================
	var _ = (function() {
		// these functions are pulled from the Underscore.js library and slightly
		// modified to handle the quirks of FW's JS engine.
		//
		//     Underscore.js 1.4.3
		//     http://underscorejs.org
		//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
		//     Underscore may be freely distributed under the MIT license.

		  // Establish the object that gets returned to break out of a loop iteration.
		  var breaker = false;

		  // Save bytes in the minified (but not gzipped) version:
		  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

		  // Create quick reference variables for speed access to core prototypes.
		  var push             = ArrayProto.push,
			  slice            = ArrayProto.slice,
			  concat           = ArrayProto.concat,
			  toString         = ObjProto.toString,
			  hasOwnProperty   = ObjProto.hasOwnProperty;

		  // All **ECMAScript 5** native function implementations that we hope to use
		  // are declared here.
		  var
			nativeForEach      = ArrayProto.forEach,
			nativeMap          = ArrayProto.map,
			nativeReduce       = ArrayProto.reduce,
			nativeReduceRight  = ArrayProto.reduceRight,
			nativeFilter       = ArrayProto.filter,
			nativeEvery        = ArrayProto.every,
			nativeSome         = ArrayProto.some,
			nativeIndexOf      = ArrayProto.indexOf,
			nativeLastIndexOf  = ArrayProto.lastIndexOf,
			nativeIsArray      = Array.isArray,
			nativeKeys         = Object.keys,
			nativeBind         = FuncProto.bind;

		  // Create a safe reference to the Underscore object for use below.
		  var _ = function(obj) {
			if (obj instanceof _) return obj;
			if (!(this instanceof _)) return new _(obj);
			this._wrapped = obj;
		  };

		  // Collection Functions
		  // --------------------

		  // The cornerstone, an `each` implementation, aka `forEach`.
		  // Handles objects with the built-in `forEach`, arrays, and raw objects.
		  // Delegates to **ECMAScript 5**'s native `forEach` if available.
		  var each = _.each = _.forEach = function(obj, iterator, context) {
			if (obj == null) return;
			if (nativeForEach && obj.forEach === nativeForEach) {
			  obj.forEach(iterator, context);
			} else if (obj.length === +obj.length) {
			  for (var i = 0, l = obj.length; i < l; i++) {
				if (iterator.call(context, obj[i], i, obj) === breaker) return;
			  }
			} else {
			  for (var key in obj) {
				  // don't call has() for each key, since hasOwnProperty fails
				  // for the keys on native FW elements
				if (_.has(obj, key)) {
				  if (iterator.call(context, obj[key], key, obj) === breaker) return;
				}
			  }
			}
		  };

		  // Return the results of applying the iterator to each element.
		  // Delegates to **ECMAScript 5**'s native `map` if available.
		  _.map = _.collect = function(obj, iterator, context) {
			var results = [];
			if (obj == null) return results;
			if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
			each(obj, function(value, index, list) {
			  results[results.length] = iterator.call(context, value, index, list);
			});
			return results;
		  };

		  var reduceError = 'Reduce of empty array with no initial value';

		  // **Reduce** builds up a single result from a list of values, aka `inject`,
		  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
		  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
			var initial = arguments.length > 2;
			if (obj == null) obj = [];
			if (nativeReduce && obj.reduce === nativeReduce) {
			  if (context) iterator = _.bind(iterator, context);
			  return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
			}
			each(obj, function(value, index, list) {
			  if (!initial) {
				memo = value;
				initial = true;
			  } else {
				memo = iterator.call(context, memo, value, index, list);
			  }
			});
			if (!initial) throw new TypeError(reduceError);
			return memo;
		  };

		  // The right-associative version of reduce, also known as `foldr`.
		  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
		  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
			var initial = arguments.length > 2;
			if (obj == null) obj = [];
			if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
			  if (context) iterator = _.bind(iterator, context);
			  return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
			}
			var length = obj.length;
			if (length !== +length) {
			  var keys = _.keys(obj);
			  length = keys.length;
			}
			each(obj, function(value, index, list) {
			  index = keys ? keys[--length] : --length;
			  if (!initial) {
				memo = obj[index];
				initial = true;
			  } else {
				memo = iterator.call(context, memo, obj[index], index, list);
			  }
			});
			if (!initial) throw new TypeError(reduceError);
			return memo;
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
			if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
			each(obj, function(value, index, list) {
			  if (iterator.call(context, value, index, list)) results[results.length] = value;
			});
			return results;
		  };

		  // Return all the elements for which a truth test fails.
		  _.reject = function(obj, iterator, context) {
			return _.filter(obj, function(value, index, list) {
			  return !iterator.call(context, value, index, list);
			}, context);
		  };

		  // Determine whether all of the elements match a truth test.
		  // Delegates to **ECMAScript 5**'s native `every` if available.
		  // Aliased as `all`.
		  _.every = _.all = function(obj, iterator, context) {
			iterator || (iterator = _.identity);
			var result = true;
			if (obj == null) return result;
			if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
			each(obj, function(value, index, list) {
			  if (!(result = result && iterator.call(context, value, index, list))) return breaker;
			});
			return !!result;
		  };

		  // Determine if at least one element in the object matches a truth test.
		  // Delegates to **ECMAScript 5**'s native `some` if available.
		  // Aliased as `any`.
		  var any = _.some = _.any = function(obj, iterator, context) {
			iterator || (iterator = _.identity);
			var result = false;
			if (obj == null) return result;
			if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
			each(obj, function(value, index, list) {
			  if (result || (result = iterator.call(context, value, index, list))) return breaker;
			});
			return !!result;
		  };

		  // Determine if the array or object contains a given value (using `===`).
		  // Aliased as `include`.
		  _.contains = _.include = function(obj, target) {
			if (obj == null) return false;
			if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
			return any(obj, function(value) {
			  return value === target;
			});
		  };

		  // Invoke a method (with arguments) on every item in a collection.
		  _.invoke = function(obj, method) {
			var args = slice.call(arguments, 2);
			var isFunc = _.isFunction(method);
			return _.map(obj, function(value) {
			  return (isFunc ? method : value[method]).apply(value, args);
			});
		  };

		  // Convenience version of a common use case of `map`: fetching a property.
		  _.pluck = function(obj, key) {
			return _.map(obj, function(value){ return value[key]; });
		  };

		  // Convenience version of a common use case of `filter`: selecting only objects
		  // with specific `key:value` pairs.
		  _.where = function(obj, attrs) {
			if (_.isEmpty(attrs)) return [];
			return _.filter(obj, function(value) {
			  for (var key in attrs) {
				if (attrs[key] !== value[key]) return false;
			  }
			  return true;
			});
		  };

		  // Return the maximum element or (element-based computation).
		  // Can't optimize arrays of integers longer than 65,535 elements.
		  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
		  _.max = function(obj, iterator, context) {
			if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
			  return Math.max.apply(Math, obj);
			}
			if (!iterator && _.isEmpty(obj)) return -Infinity;
			var result = {computed : -Infinity, value: -Infinity};
			each(obj, function(value, index, list) {
			  var computed = iterator ? iterator.call(context, value, index, list) : value;
			  computed >= result.computed && (result = {value : value, computed : computed});
			});
			return result.value;
		  };

		  // Return the minimum element (or element-based computation).
		  _.min = function(obj, iterator, context) {
			if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
			  return Math.min.apply(Math, obj);
			}
			if (!iterator && _.isEmpty(obj)) return Infinity;
			var result = {computed : Infinity, value: Infinity};
			each(obj, function(value, index, list) {
			  var computed = iterator ? iterator.call(context, value, index, list) : value;
			  computed < result.computed && (result = {value : value, computed : computed});
			});
			return result.value;
		  };

		  // Shuffle an array.
		  _.shuffle = function(obj) {
			var rand;
			var index = 0;
			var shuffled = [];
			each(obj, function(value) {
			  rand = _.random(index++);
			  shuffled[index - 1] = shuffled[rand];
			  shuffled[rand] = value;
			});
			return shuffled;
		  };

		  // An internal function to generate lookup iterators.
		  var lookupIterator = function(value) {
			return _.isFunction(value) ? value : function(obj){ return obj[value]; };
		  };

		  // Sort the object's values by a criterion produced by an iterator.
		  _.sortBy = function(obj, value, context) {
			var iterator = lookupIterator(value);
			return _.pluck(_.map(obj, function(value, index, list) {
			  return {
				value : value,
				index : index,
				criteria : iterator.call(context, value, index, list)
			  };
			}).sort(function(left, right) {
			  var a = left.criteria;
			  var b = right.criteria;
			  if (a !== b) {
				if (a > b || a === void 0) return 1;
				if (a < b || b === void 0) return -1;
			  }
			  return left.index < right.index ? -1 : 1;
			}), 'value');
		  };

		  // An internal function used for aggregate "group by" operations.
		  var group = function(obj, value, context, behavior) {
			var result = {};
			var iterator = lookupIterator(value || _.identity);
			each(obj, function(value, index) {
			  var key = iterator.call(context, value, index, obj);
			  behavior(result, key, value);
			});
			return result;
		  };

		  // Groups the object's values by a criterion. Pass either a string attribute
		  // to group by, or a function that returns the criterion.
		  _.groupBy = function(obj, value, context) {
			return group(obj, value, context, function(result, key, value) {
			  (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
			});
		  };

		  // Counts instances of an object that group by a certain criterion. Pass
		  // either a string attribute to count by, or a function that returns the
		  // criterion.
		  _.countBy = function(obj, value, context) {
			return group(obj, value, context, function(result, key) {
			  if (!_.has(result, key)) result[key] = 0;
			  result[key]++;
			});
		  };

		  // Use a comparator function to figure out the smallest index at which
		  // an object should be inserted so as to maintain order. Uses binary search.
		  _.sortedIndex = function(array, obj, iterator, context) {
			iterator = iterator == null ? _.identity : lookupIterator(iterator);
			var value = iterator.call(context, obj);
			var low = 0, high = array.length;
			while (low < high) {
			  var mid = (low + high) >>> 1;
			  iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
			}
			return low;
		  };

		  // Safely convert anything iterable into a real, live array.
		  _.toArray = function(obj) {
			if (!obj) return [];
			if (_.isArray(obj)) return slice.call(obj);
			if (obj.length === +obj.length) return _.map(obj, _.identity);
			return _.values(obj);
		  };

		  // Return the number of elements in an object.
		  _.size = function(obj) {
			if (obj == null) return 0;
			return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
		  };

		  // Array Functions
		  // ---------------

		  // Get the first element of an array. Passing **n** will return the first N
		  // values in the array. Aliased as `head` and `take`. The **guard** check
		  // allows it to work with `_.map`.
		  _.first = _.head = _.take = function(array, n, guard) {
			if (array == null) return void 0;
			return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
		  };

		  // Returns everything but the last entry of the array. Especially useful on
		  // the arguments object. Passing **n** will return all the values in
		  // the array, excluding the last N. The **guard** check allows it to work with
		  // `_.map`.
		  _.initial = function(array, n, guard) {
			return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
		  };

		  // Get the last element of an array. Passing **n** will return the last N
		  // values in the array. The **guard** check allows it to work with `_.map`.
		  _.last = function(array, n, guard) {
			if (array == null) return void 0;
			if ((n != null) && !guard) {
			  return slice.call(array, Math.max(array.length - n, 0));
			} else {
			  return array[array.length - 1];
			}
		  };

		  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
		  // Especially useful on the arguments object. Passing an **n** will return
		  // the rest N values in the array. The **guard**
		  // check allows it to work with `_.map`.
		  _.rest = _.tail = _.drop = function(array, n, guard) {
			return slice.call(array, (n == null) || guard ? 1 : n);
		  };

		  // Trim out all falsy values from an array.
		  _.compact = function(array) {
			return _.filter(array, _.identity);
		  };

		  // Internal implementation of a recursive `flatten` function.
		  var flatten = function(input, shallow, output) {
			each(input, function(value) {
			  if (_.isArray(value)) {
				shallow ? push.apply(output, value) : flatten(value, shallow, output);
			  } else {
				output.push(value);
			  }
			});
			return output;
		  };

		  // Return a completely flattened version of an array.
		  _.flatten = function(array, shallow) {
			return flatten(array, shallow, []);
		  };

		  // Return a version of the array that does not contain the specified value(s).
		  _.without = function(array) {
			return _.difference(array, slice.call(arguments, 1));
		  };

		  // Produce a duplicate-free version of the array. If the array has already
		  // been sorted, you have the option of using a faster algorithm.
		  // Aliased as `unique`.
		  _.uniq = _.unique = function(array, isSorted, iterator, context) {
			if (_.isFunction(isSorted)) {
			  context = iterator;
			  iterator = isSorted;
			  isSorted = false;
			}
			var initial = iterator ? _.map(array, iterator, context) : array;
			var results = [];
			var seen = [];
			each(initial, function(value, index) {
			  if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
				seen.push(value);
				results.push(array[index]);
			  }
			});
			return results;
		  };

		  // Produce an array that contains the union: each distinct element from all of
		  // the passed-in arrays.
		  _.union = function() {
			return _.uniq(concat.apply(ArrayProto, arguments));
		  };

		  // Produce an array that contains every item shared between all the
		  // passed-in arrays.
		  _.intersection = function(array) {
			var rest = slice.call(arguments, 1);
			return _.filter(_.uniq(array), function(item) {
			  return _.every(rest, function(other) {
				return _.indexOf(other, item) >= 0;
			  });
			});
		  };

		  // Take the difference between one array and a number of other arrays.
		  // Only the elements present in just the first array will remain.
		  _.difference = function(array) {
			var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
			return _.filter(array, function(value){ return !_.contains(rest, value); });
		  };

		  // Zip together multiple lists into a single array -- elements that share
		  // an index go together.
		  _.zip = function() {
			var args = slice.call(arguments);
			var length = _.max(_.pluck(args, 'length'));
			var results = new Array(length);
			for (var i = 0; i < length; i++) {
			  results[i] = _.pluck(args, "" + i);
			}
			return results;
		  };

		  // Converts lists into objects. Pass either a single array of `[key, value]`
		  // pairs, or two parallel arrays of the same length -- one of keys, and one of
		  // the corresponding values.
		  _.object = function(list, values) {
			if (list == null) return {};
			var result = {};
			for (var i = 0, l = list.length; i < l; i++) {
			  if (values) {
				result[list[i]] = values[i];
			  } else {
				result[list[i][0]] = list[i][1];
			  }
			}
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
			var i = 0, l = array.length;
			if (isSorted) {
			  if (typeof isSorted == 'number') {
				i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
			  } else {
				i = _.sortedIndex(array, item);
				return array[i] === item ? i : -1;
			  }
			}
			if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
			for (; i < l; i++) if (array[i] === item) return i;
			return -1;
		  };

		  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
		  _.lastIndexOf = function(array, item, from) {
			if (array == null) return -1;
			var hasIndex = from != null;
			if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
			  return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
			}
			var i = (hasIndex ? from : array.length);
			while (i--) if (array[i] === item) return i;
			return -1;
		  };

		  // Generate an integer Array containing an arithmetic progression. A port of
		  // the native Python `range()` function. See
		  // [the Python documentation](http://docs.python.org/library/functions.html#range).
		  _.range = function(start, stop, step) {
			if (arguments.length <= 1) {
			  stop = start || 0;
			  start = 0;
			}
			step = arguments[2] || 1;

			var len = Math.max(Math.ceil((stop - start) / step), 0);
			var idx = 0;
			var range = new Array(len);

			while(idx < len) {
			  range[idx++] = start;
			  start += step;
			}

			return range;
		  };

		  // Function (ahem) Functions
		  // ------------------

		  // Reusable constructor function for prototype setting.
		  var ctor = function(){};

		  // Create a function bound to a given object (assigning `this`, and arguments,
		  // optionally). Binding with arguments is also known as `curry`.
		  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
		  // We check for `func.bind` first, to fail fast when `func` is undefined.
		  _.bind = function(func, context) {
			var args, bound;
			if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
			if (!_.isFunction(func)) throw new TypeError;
			args = slice.call(arguments, 2);
			return bound = function() {
			  if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
			  ctor.prototype = func.prototype;
			  var self = new ctor;
			  ctor.prototype = null;
			  var result = func.apply(self, args.concat(slice.call(arguments)));
			  if (Object(result) === result) return result;
			  return self;
			};
		  };

		  // Bind all of an object's methods to that object. Useful for ensuring that
		  // all callbacks defined on an object belong to it.
		  _.bindAll = function(obj) {
			var funcs = slice.call(arguments, 1);
			if (funcs.length === 0) funcs = _.functions(obj);
			each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
			return obj;
		  };

		  // Memoize an expensive function by storing its results.
		  _.memoize = function(func, hasher) {
			var memo = {};
			hasher || (hasher = _.identity);
			return function() {
			  var key = hasher.apply(this, arguments);
			  return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
			};
		  };

		  // Returns a function that will be executed at most one time, no matter how
		  // often you call it. Useful for lazy initialization.
		  _.once = function(func) {
			var ran = false, memo;
			return function() {
			  if (ran) return memo;
			  ran = true;
			  memo = func.apply(this, arguments);
			  func = null;
			  return memo;
			};
		  };

		  // Returns the first function passed as an argument to the second,
		  // allowing you to adjust arguments, run code before and after, and
		  // conditionally execute the original function.
		  _.wrap = function(func, wrapper) {
			return function() {
			  var args = [func];
			  push.apply(args, arguments);
			  return wrapper.apply(this, args);
			};
		  };

		  // Returns a function that is the composition of a list of functions, each
		  // consuming the return value of the function that follows.
		  _.compose = function() {
			var funcs = arguments;
			return function() {
			  var args = arguments;
			  for (var i = funcs.length - 1; i >= 0; i--) {
				args = [funcs[i].apply(this, args)];
			  }
			  return args[0];
			};
		  };

		  // Returns a function that will only be executed after being called N times.
		  _.after = function(times, func) {
			if (times <= 0) return func();
			return function() {
			  if (--times < 1) {
				return func.apply(this, arguments);
			  }
			};
		  };

		  // Object Functions
		  // ----------------

		  // Retrieve the names of an object's properties.
		  // Delegates to **ECMAScript 5**'s native `Object.keys`
		  _.keys = nativeKeys || function(obj, dontSort) {
			if (obj !== Object(obj)) throw new TypeError('Invalid object');
			var keys = [];
			for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;

				// sort the list of keys by default to make the list easier to
				// scan in the console
			if (!dontSort) {
				keys.sort();
			}

			return keys;
		  };

		  // Retrieve the values of an object's properties.
		  _.values = function(obj) {
			var values = [];
			for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
			return values;
		  };

		  // Convert an object into a list of `[key, value]` pairs.
		  _.pairs = function(obj) {
			var pairs = [];
			for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
			return pairs;
		  };

		  // Invert the keys and values of an object. The values must be serializable.
		  _.invert = function(obj) {
			var result = {};
			for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
			return result;
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

		  // Extend a given object with all the properties in passed-in object(s).
		  _.extend = function(obj) {
			each(slice.call(arguments, 1), function(source) {
			  if (source) {
				for (var prop in source) {
				  obj[prop] = source[prop];
				}
			  }
			});
			return obj;
		  };

		  // Return a copy of the object only containing the whitelisted properties.
		  _.pick = function(obj) {
			var copy = {};
			var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
			each(keys, function(key) {
			  if (key in obj) copy[key] = obj[key];
			});
			return copy;
		  };

		   // Return a copy of the object without the blacklisted properties.
		  _.omit = function(obj) {
			var copy = {};
			var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
			for (var key in obj) {
			  if (!_.contains(keys, key)) copy[key] = obj[key];
			}
			return copy;
		  };

		  // Fill in a given object with default properties.
		  _.defaults = function(obj) {
			each(slice.call(arguments, 1), function(source) {
			  if (source) {
				for (var prop in source) {
				  if (obj[prop] == null) obj[prop] = source[prop];
				}
			  }
			});
			return obj;
		  };

		  // Create a (shallow-cloned) duplicate of an object.
		  _.clone = function(obj) {
			if (!_.isObject(obj)) return obj;
			return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
		  };

		  // Invokes interceptor with the obj, and then returns obj.
		  // The primary purpose of this method is to "tap into" a method chain, in
		  // order to perform operations on intermediate results within the chain.
		  _.tap = function(obj, interceptor) {
			interceptor(obj);
			return obj;
		  };

		  // Internal recursive comparison function for `isEqual`.
		  var eq = function(a, b, aStack, bStack) {
			// Identical objects are equal. `0 === -0`, but they aren't identical.
			// See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
			if (a === b) return a !== 0 || 1 / a == 1 / b;
			// A strict comparison is necessary because `null == undefined`.
			if (a == null || b == null) return a === b;
			// Unwrap any wrapped objects.
			if (a instanceof _) a = a._wrapped;
			if (b instanceof _) b = b._wrapped;
			// Compare `[[Class]]` names.
			var className = toString.call(a);
			if (className != toString.call(b)) return false;
			switch (className) {
			  // Strings, numbers, dates, and booleans are compared by value.
			  case '[object String]':
				// Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
				// equivalent to `new String("5")`.
				return a == String(b);
			  case '[object Number]':
				// `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
				// other numeric values.
				return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
			  case '[object Date]':
			  case '[object Boolean]':
				// Coerce dates and booleans to numeric primitive values. Dates are compared by their
				// millisecond representations. Note that invalid dates with millisecond representations
				// of `NaN` are not equivalent.
				return +a == +b;
			  // RegExps are compared by their source patterns and flags.
			  case '[object RegExp]':
				return a.source == b.source &&
					   a.global == b.global &&
					   a.multiline == b.multiline &&
					   a.ignoreCase == b.ignoreCase;
			}
			if (typeof a != 'object' || typeof b != 'object') return false;
			// Assume equality for cyclic structures. The algorithm for detecting cyclic
			// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
			var length = aStack.length;
			while (length--) {
			  // Linear search. Performance is inversely proportional to the number of
			  // unique nested structures.
			  if (aStack[length] == a) return bStack[length] == b;
			}
			// Add the first object to the stack of traversed objects.
			aStack.push(a);
			bStack.push(b);
			var size = 0, result = true;
			// Recursively compare objects and arrays.
			if (className == '[object Array]') {
			  // Compare array lengths to determine if a deep comparison is necessary.
			  size = a.length;
			  result = size == b.length;
			  if (result) {
				// Deep compare the contents, ignoring non-numeric properties.
				while (size--) {
				  if (!(result = eq(a[size], b[size], aStack, bStack))) break;
				}
			  }
			} else {
			  // Objects with different constructors are not equivalent, but `Object`s
			  // from different frames are.
			  var aCtor = a.constructor, bCtor = b.constructor;
			  if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
									   _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
				return false;
			  }
			  // Deep compare objects.
			  for (var key in a) {
				if (_.has(a, key)) {
				  // Count the expected number of properties.
				  size++;
				  // Deep compare each member.
				  if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
				}
			  }
			  // Ensure that both objects contain the same number of properties.
			  if (result) {
				for (key in b) {
				  if (_.has(b, key) && !(size--)) break;
				}
				result = !size;
			  }
			}
			// Remove the first object from the stack of traversed objects.
			aStack.pop();
			bStack.pop();
			return result;
		  };

		  // Perform a deep comparison to check if two objects are equal.
		  _.isEqual = function(a, b) {
			return eq(a, b, [], []);
		  };

		  // Is a given array, string, or object empty?
		  // An "empty" object has no enumerable own-properties.
		  _.isEmpty = function(obj) {
			if (obj == null) return true;
			if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
			for (var key in obj) if (_.has(obj, key)) return false;
			return true;
		  };

		  // Is a given value a DOM element?
		  _.isElement = function(obj) {
			return !!(obj && obj.nodeType === 1);
		  };

		  // Is a given value an array?
		  // Delegates to ECMA5's native Array.isArray
		  _.isArray = nativeIsArray || function(obj) {
			return toString.call(obj) == '[object Array]';
		  };

		  // Is a given variable an object?
		  _.isObject = function(obj) {
			return obj === Object(obj);
		  };

		  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
		  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
			_['is' + name] = function(obj) {
			  return toString.call(obj) == '[object ' + name + ']';
			};
		  });

		  // Define a fallback version of the method in browsers (ahem, IE), where
		  // there isn't any inspectable "Arguments" type.
		  if (!_.isArguments(arguments)) {
			_.isArguments = function(obj) {
			  return !!(obj && _.has(obj, 'callee'));
			};
		  }

		  // Optimize `isFunction` if appropriate.
		  if (typeof (/./) !== 'function') {
			_.isFunction = function(obj) {
			  return typeof obj === 'function';
			};
		  }

		  // Is a given object a finite number?
		  _.isFinite = function(obj) {
			return isFinite(obj) && !isNaN(parseFloat(obj));
		  };

		  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
		  _.isNaN = function(obj) {
			return _.isNumber(obj) && obj != +obj;
		  };

		  // Is a given value a boolean?
		  _.isBoolean = function(obj) {
			return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
		  };

		  // Is a given value equal to null?
		  _.isNull = function(obj) {
			return obj === null;
		  };

		  // Is a given variable undefined?
		  _.isUndefined = function(obj) {
			return obj === void 0;
		  };

		  // Shortcut function for checking if an object has a given property directly
		  // on itself (in other words, not on a prototype).
		  _.has = function(obj, key) {
			return hasOwnProperty.call(obj, key);
		  };

		  // Keep the identity function around for default iterators.
		  _.identity = function(value) {
			return value;
		  };

		  // Run a function **n** times.
		  _.times = function(n, iterator, context) {
			var accum = Array(n);
			for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
			return accum;
		  };

		  // Return a random integer between min and max (inclusive).
		  _.random = function(min, max) {
			if (max == null) {
			  max = min;
			  min = 0;
			}
			return min + Math.floor(Math.random() * (max - min + 1));
		  };

		  // If the value of the named property is a function then invoke it;
		  // otherwise, return it.
		  _.result = function(object, property) {
			if (object == null) return null;
			var value = object[property];
			return _.isFunction(value) ? value.call(object) : value;
		  };

		  // Add your own custom functions to the Underscore object.
		  _.mixin = function(obj) {
			each(_.functions(obj), function(name){
			  var func = _[name] = obj[name];
			  _.prototype[name] = function() {
				var args = [this._wrapped];
				push.apply(args, arguments);
				return result.call(this, func.apply(_, args));
			  };
			});
		  };

		  // Add a "chain" function, which will delegate to the wrapper.
		  _.chain = function(obj) {
			return _(obj).chain();
		  };

		  // OOP
		  // ---------------
		  // If Underscore is called as a function, it returns a wrapped object that
		  // can be used OO-style. This wrapper holds altered versions of all the
		  // underscore functions. Wrapped objects may be chained.

		  // Helper function to continue chaining intermediate results.
		  var result = function(obj) {
			return this._chain ? _(obj).chain() : obj;
		  };

		  // Add all of the Underscore functions to the wrapper object.
		  _.mixin(_);

		  // Add all mutator Array functions to the wrapper.
		  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
			var method = ArrayProto[name];
			_.prototype[name] = function() {
			  var obj = this._wrapped;
			  method.apply(obj, arguments);
			  if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
			  return result.call(this, obj);
			};
		  });

		  // Add all accessor Array functions to the wrapper.
		  each(['concat', 'join', 'slice'], function(name) {
			var method = ArrayProto[name];
			_.prototype[name] = function() {
			  return result.call(this, method.apply(this._wrapped, arguments));
			};
		  });

		  _.extend(_.prototype, {

			// Start chaining a wrapped Underscore object.
			chain: function() {
			  this._chain = true;
			  return this;
			},

			// Extracts the result from a wrapped and chained object.
			value: function() {
			  return this._wrapped;
			}
		  });

		(function() {
			var fwTypes = {},
				fwMethods = {},
				typeRE = /^\[object (.+)\]$/;

			_.forEach(
					// return the global properties that begin with the prefix
					// used by all FW-native types
				_.filter(_.keys(this), function(key) {
					return key.indexOf("_proto_for_fw_") == 0;
				}),
				function(key) {
					var typeString = this[key].toString(),
						typeName = typeString.match(typeRE)[1];

						// every FW-specific global prototype object has a
						// toString() method, the return value of which we add
						// to the hash of FW-native types
					fwTypes[typeString] = 1;

					fwMethods["is" + typeName] = function(obj)
					{
						return toString.call(obj) == typeString;
					}
				}
			);

				// replace the auto-generated isGroup method with one that returns
				// false if it's actually a smart shape
			fwMethods.isGroup = function(obj)
			{
				return toString.call(obj) == "[object Group]" && !obj.isSmartShape;
			};

				// there's no SmartShape native type, so add a method for it
			fwMethods.isSmartShape = function(obj)
			{
				return obj.isSmartShape === true;
			};

				// we have to override has() because instances of the native FW
				// types don't correctly support hasOwnProperty().
				// hasOwnProperty(dom, "isDirty") returns false but "isDirty" in dom
				// is true.  so if obj is a native type, fall back to using in.
			fwMethods.has = function(obj, key) {
				return (obj in fwTypes && key in obj) || hasOwnProperty.call(obj, key);
			};

				// add the equivalent of ES5 Object.create()
			fwMethods.createObject = function(prototype, properties)
			{
				var object;
				function Type() {} // An empty constructor.

				if (prototype === null) {
					object = { "__proto__": null };
				} else {
					if (typeof prototype !== "object" && typeof prototype !== "function") {
						// In the native implementation `parent` can be `null`
						// OR *any* `instanceof Object` (Object|Function|Array|RegExp|etc)
						// Use `typeof` tho, b/c in old IE, DOM elements are not `instanceof Object`
						// like they are in modern browsers. Using `Object.create` on DOM elements
						// is...err...probably inappropriate, but the native version allows for it.
						throw new TypeError("Object prototype may only be an Object or null"); // same msg as Chrome
					}
					Type.prototype = prototype;
					object = new Type();
					// IE has no built-in implementation of `Object.getPrototypeOf`
					// neither `__proto__`, but this manually setting `__proto__` will
					// guarantee that `Object.getPrototypeOf` will work as expected with
					// objects created using `Object.create`
					object.__proto__ = prototype;
				}

				if (properties) {
					_.extend(object, properties);
				}

				return object;
			};

			_.mixin(fwMethods);
		})();

		  return _;
	})();


	// =======================================================================
	var StringFormatter = {
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
			} else if (inObject instanceof Array || inObject.toString() == "[object FwArray]" ||
					inObject.toString() == "[object Arguments]") {
				return this.array(inObject, inDepth);
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


	// =======================================================================
	var stringify = (function() {
			// embed a local copy of the dojo JSON library, which has been changed
			// to not depend on any other part of dojo.  that way, we don't have to
			// rely on external libraries.  unlike Crockford's library, the dojo
			// implementation doesn't change the prototypes of basic types, which
			// caused problems for the Path panel, and possibly others.
		var dojo = {};

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

		return dojo.toJson;
	})();


	// =======================================================================
	var logFile = (function() {
		var logFileName = "Fireworks Console",
			logFilePath;


		function convertURLToOSPath(
			inURL)
		{
			var path;

			if (fw.platform == "win") {
					// replace file:///C| with C: and turn / into \
				path = inURL.replace(/file:\/\/\/([A-Z])\|/, "$1:");
				path = path.replace(/\//g, "\\");
			} else {
					// replace file:/// with /Volumes/
				path = inURL.replace(/file:\/\//, "/Volumes");
			}

			return unescape(path);
		}


		function prefixZero(
			inValue)
		{
			return ("0" + inValue).slice(-2);
		}


		return {
			append: function(
				inCallerName,
				inText)
			{
				if (!logFilePath || !Files.exists(logFilePath)) {
						// save the console file at whatever path the panel
						// passed into us via _swfPath
					logFilePath = Files.getDirectory(console._swfPath) + "/" +
						logFileName + ".txt";

						// first create the file so we can set its Mac type
					Files.createFile(logFilePath, "TEXT", "????");
				}

				var file = new File(convertURLToOSPath(logFilePath)),
					result = false;

				inText = ">>> " + (inCallerName ? inCallerName + "(): " : "") + inText + "\n";

				if (file.open("append")) {
						// for some bizarre reason, file.write() appends a newline
						// to the string that's written, but file.writeln() doesn't,
						// despite the source code looking correct.
					result = file.writeln(inText);
					file.close();
				}

				return result;
			},
			clear: function(
				inKeepFile)
			{
				if (inKeepFile) {
					var now = new Date(),
						date = [
							now.getFullYear(),
							prefixZero(now.getMonth() + 1),
							prefixZero(now.getDay())
						].join("-"),
							// convert the : to . so the time works as a Mac filename
						time = now.toTimeString().match(/([\d:]+)/)[1].replace(/:/g, "."),
						filename = typeof inKeepFile == "string" ? inKeepFile : logFileName;

					Files.rename(logFilePath, [filename, date, time].join(" ") + ".txt");
				} else {
					Files.deleteFileIfExisting(logFilePath);
				}
			}
		};
	})();


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
			logEntryText,
			callerName = inCaller.name || "";

		for (var i = 2, len = arguments.length; i < len; i++) {
			var variant = arguments[i];

			if (typeof variant == "string") {
					// we don't use the string StringFormatter here because we don't
					// want double quotes around strings when calling log("here's a string");
				s.push(variant);
			} else {
				s.push(StringFormatter.format(variant));
			}
		}

		if (_showStack) {
			var callers = [];

				// follow the call stack, up to 5 deep, in case we run into a loop
			for (var depth = 0, fn = inCaller.caller; depth < 5 && fn; depth++, fn = fn.caller) {
				callers.push(fn.name || ".");
			}

			if (callers.length) {
					// we walked the stack from bottom to top, but we want to
					// display the calls from top to bottom
				callers.reverse();
				callerName = callers.join(" > ") + " > " + (callerName || "anonymous");
			}
		}

		logEntryText = s.join(" ");

			// due to the annoying-as-fuck modal "processing command" dialog that
			// will appear on top of FW and require a force-quit if the call stack
			// gets more than one or two levels deep, we can't delay the conversion
			// of the log entries to JSON until the console polls for the latest
			// entries.  so we have to convert the parameters to a JSON string
			// now, and push the string onto an array.  ffs.
		console._logEntries.push(stringify({
			type: inType,
			text: logEntryText,
			caller: callerName,
			time: now()
		}));

			// keep only the last X log entries, in case the console panel
			// isn't picking them up
		console._logEntries = console._logEntries.slice(-console.retention);

		logFile.append(callerName, logEntryText);
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


			// the max number of log entries to keep
		retention: 100,


			// this array stores the JSON strings until the panel wants them
		_logEntries: [],

			// this string temporarily holds the JSON string version of the
			// _logEntries array
		_logEntriesJSON: "",


			// the clear() method sets this to true to let the panel know to
			// clear the log display
		_clearLog: false,


			// the path to the console .swf panel, set by the AS side after the
			// JS is loaded
		_swfPath: "",


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
			var result;

			try {
					// pass the _ library into the evaluate function, since _ is
					// not in its scope
				result = StringFormatter.format(evaluate(inCode, _));
			} catch (e) {
					// the eval in evaluate may throw an exception, so convert
					// it to a string
				result = e.toString();
			}

			logFile.append("", result);

			return result;
		},


		// ===================================================================
		time: function(
			inTimerName)
		{
			_timers[inTimerName] = now();
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
		line: function(
			inSegment,
			inCount)
		{
			inSegment = inSegment || "-";
			inCount = isNaN(inCount) ? 60 : inCount;

			var line = [];
			line.length = Math.round((inCount + 1) / inSegment.length);
			this.log(line.join(inSegment));
		},


		// ===================================================================
		dir: function(
			inObject,
			inMessage)
		{
			inMessage = inMessage ? inMessage + ": " : "";

				// we need to call StringFormatter ourselves, since if we
				// passed inMessage as a separate parameter, there'd be an extra
				// space in the log if inMessage was empty.  also pass any args
				// after inMessage to addLogEntry, so that they get displayed.
			addLogEntry.apply(this, [
				"log",
				arguments.callee.caller,
				inMessage + (inObject === Object(inObject) ?
					StringFormatter.format(_.keys(inObject)) : "null")
			].concat(_.toArray(arguments).slice(2)));
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
			inProperties = [].concat(inProperties);

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
			inProperties = [].concat(inProperties);

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
			this._logEntries.push(stringify({
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
		clear: function(
			inKeepFile)
		{
			this._logEntries = [];
			this._logEntriesJSON = "";
			this._clearLog = true;
			logFile.clear(inKeepFile);
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
})(
		// this function is defined outside the main module so that it can't see
		// any of the module's variables
	function(
		inCode,
		_)
	{
			// annoyingly, calling fw.getDocumentDOM() when no docs are
			// open seems to throw an error, which doesn't seem to get
			// reported by the console.  to make the console work when no
			// doc is open, call getDocumentDOM only when something is open.
		var dom = fw.documents.length && fw.getDocumentDOM(),
			sel = fw.selection,
			el = fw.selection && fw.selection[0],
			global = (function() { return this; })();

			// eval the code in the context of the underscore library, so
			// the code can use keys(), pluck(), etc.  we don't wrap the eval
			// in a try/catch so that our caller can catch the exception and
			// treat it differently.
		with (_) {
			return eval(inCode);
		}
	}
);
