// Generated by CoffeeScript 1.12.7
(function() {
  module.exports = {
    back: function() {
      if (this.states.length) {
        return this.states.pop()();
      }
    },
    chain: [],
    reset: function() {
      var results;
      results = [];
      while (this.states.length) {
        results.push(this.states.pop()());
      }
      return results;
    },
    states: []
  };

}).call(this);
