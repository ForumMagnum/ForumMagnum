/**
 * js-weighted-list.js
 * 
 * version 0.2
 * 
 * This file is licensed under the MIT License, please see MIT-LICENSE.txt for details.
 * 
 * https://github.com/timgilbert/js-weighted-list is its home.
 */

export class WeightedList
{
  weights: any
  data: any
  length: any
  hasData: any
  
  constructor(initial?: any) {
    this.weights = {};
    this.data = {};
    this.length = 0;
    this.hasData = false;

    initial = typeof initial !== 'undefined' ? initial : [];

    if (Array.isArray(initial)) {
      for (var i = 0; i < initial.length; i++) {
        //var item = initial[i];
        //this.push(item[0], item[1], item[2]);
        this.push(initial[i]);
      }
    } else {
      throw new Error('Unknown object "' + initial.toString() + '" passed to ' + 
                      'WeightedList constructor! (Expected array or nothing)');
    }
  }

  /**
   * Add a single item to the list.  The parameter passed in represents a single 
   * key, with a weight and optionally some data attached.
   * 
   * The parameter to this function can either be a 2-3 element array of 
   * [k, w, d] for key, weight and data (data is optional) or an object with the 
   * values {'key': k, 'weight': w, 'data': d} where d is optional.
   */
  push(element: any) {
    var key, weight, data;

    if (Array.isArray(element)) {
      key = element[0], weight = element[1], data = element[2];
      if (typeof key === 'undefined') {
        // Eg, wl.push([])
        throw new Error('In WeightedList.push([ ... ]), need at least two elements');
      } else if (typeof weight === 'undefined') {
        // I suppose we could default to 1 here, but the API is already too forgiving
        throw new Error('In array passed to WeightedList.push([ ... ]), second ' + 
                        'element is undefined!');
      }
    } else if (typeof element === 'object') {
      // We expect {"key": "zombies", "weight": 10, "data": {"fast": true}}
      key = element.key, weight = element.weight, data = element.data;
      if (typeof key === 'undefined') {
        throw new Error("In WeightedList.push({ ... }), no {'key': 'xyzzy'} pair found");
      } else if (typeof weight === 'undefined') {
        // I suppose we could default to 1 here, but the API is already too forgiving
        throw new Error('In array passed to WeightedList.push({ ... }), no ' + 
                        "{'weight': 42} pair found");
      }
  } else {
      // else what the heck were you trying to give me?
      throw new Error('WeightedList.push() passed unknown type "' + typeof element + 
                      '", expected [key, weight] or {"key": k, "weight": w}');
    }
    return this._push_values(key, weight, data);

  }
  /**
   * Add an item to the list
   * @access private
   * @param {String} key the key under which this item is stored
   * @param {number} weight the weight to assign to this key
   * @param {?Object} data any optional data associated wth this key
   */
  _push_values(key: any, weight: number, data?: any) {
    //console.debug('k:', key, 'w:', weight, 'd:', data);

    if (this.weights[key]) {
      throw new Error('');
    }
    if (typeof weight !== typeof 1) {
      throw new Error('Weight must be numeric (got ' + (weight as any).toString() + ')');
    }
    if (weight <= 0)  {
      throw new Error('Weight must be >= 0 (got ' + weight + ')');
    }

    this.weights[key] = weight;

    if (typeof data !== 'undefined') {
      this.hasData = true;
      this.data[key] = data;
    }
    this.length++;
  }
  
  /** 
   * Add the given weight to the list item with the given key.  Note that if 
   * the key does not already exist, this operation will silently create it.
   * 
   * @todo might be nice to have a version of this that would throw an error 
   *       on an unknown key.
   */
  addWeight(key: any, weight: number) {
    this.weights[key] += weight;
  }
  
  /**
   * Select n random elements (without replacement), default 1.
   * If andRemove is true (default false), remove the elements
   * from the list.  (This is what the pop() method does.)
   */
  peek(n: number, andRemove?: boolean) {
    if (typeof n === 'undefined') {
      n = 1;
    }
    andRemove = !!andRemove;

    if (this.length - n < 0) {
      throw new Error('Stack underflow! Tried to retrieve ' + n + 
                      ' element' + (n === 1 ? '' : 's') + 
                      ' from a list of ' + this.length);
    }

    var heap = this._buildWeightedHeap();
    //console.debug('heap:', heap);
    var result: any = [];
    
    for (var i = 0; i < n; i++) {
      var key = heap.pop();
      //console.debug('k:', key);
      if (this.hasData) {
        result.push({key: key, data: this.data[key]});
      } else {
        result.push(key);
      }
      if (andRemove) {
        delete this.weights[key];
        delete this.data[key];
        this.length--;
      }
    }
    return result;
  }
  
  /**
   * Return the entire list in a random order (note that this does not mutate the list)
   */
  shuffle() {
    return this.peek(this.length);
  }
  
  /**
   * 
   */
  pop(n: number) {
    return this.peek(n, true);
  }
  
  /**
   * Build a WeightedHeap instance based on the data we've got
   */
  _buildWeightedHeap() {
    var items: any = [];
    for (var key in this.weights) if (this.weights.hasOwnProperty(key)) {
      items.push([key, this.weights[key]]);
    }
    //console.log('items',items);
    return new (<any>_WeightedHeap)(items);
  }
}

/**
 * This is a javascript implementation of the algorithm described by 
 * Jason Orendorff here: http://stackoverflow.com/a/2149533/87990
 */
function _HeapNode(this: any, weight: number, value: any, total: number) {
  this.weight = weight;
  this.value = value;
  this.total = total;  // Total weight of this node and its children
}
/**
 * Note, we're using a heap structure here for its tree properties, not as a 
 * classic binary heap. A node heap[i] has children at heap[i<<1] and at 
 * heap[(i<<1)+1]. Its parent is at h[i>>1]. Heap[0] is vacant.
 */
function _WeightedHeap(this: any, items: any) {
  this.heap = [null];   // Math is easier to read if we index array from 1
  
  // First put everything on the heap 
  for (var i = 0; i < items.length; i++) {
    var weight = items[i][1];
    var value = items[i][0];
    this.heap.push(new (<any>_HeapNode)(weight, value, weight));
  }
  // Now go through the heap and add each node's weight to its parent
  for (i = this.heap.length - 1; i > 1; i--) {
    this.heap[i>>1].total += this.heap[i].total;
  }
  //console.debug('_Wh heap', this.heap);
}

_WeightedHeap.prototype = {
  pop: function() {
    // Start with a random amount of gas
    var gas = this.heap[1].total * Math.random();
    
    // Start driving at the root node
    var i = 1;  
    
    // While we have enough gas to keep going past i:
    while (gas > this.heap[i].weight) {
      gas -= this.heap[i].weight;     // Drive past i
      i <<= 1;                        // Move to first child
      if (gas > this.heap[i].total) {
        gas -= this.heap[i].total;    // Drive past first child and its descendants
        i++;                          // Move on to second child
      }
    }
    // Out of gas - i is our selected node.
    var value = this.heap[i].value;
    var selectedWeight = this.heap[i].weight;
    
    this.heap[i].weight = 0;          // Make sure i isn't chosen again
    while (i > 0) {
      // Remove the weight from its parent's total
      this.heap[i].total -= selectedWeight;
      i >>= 1;  // Move to the next parent
    }
    return value;
  }
};

//  NB: another binary heap implementation is at
// http://eloquentjavascript.net/appendix2.html
