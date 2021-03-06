(function() {
  var Smackbone, root, _, _ref,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (typeof exports !== "undefined" && exports !== null) {
    Smackbone = exports;
    _ = require('underscore');
    Smackbone.$ = {
      done: function(func) {
        return func({});
      },
      ajax: function(options) {
        return this;
      }
    };
  } else {
    root = this;
    _ = root._;
    Smackbone = root.Smackbone = {};
    Smackbone.$ = root.$;
  }

  Smackbone.Event = (function() {
    function Event() {}

    Event.prototype.trigger = function() {
      var allEvents, args, events, name, _ref, _ref1;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      events = (_ref = this._events) != null ? _ref[name] : void 0;
      if (events != null) {
        this._triggerEvents.apply(this, [events].concat(__slice.call(args)));
      }
      allEvents = (_ref1 = this._events) != null ? _ref1.all : void 0;
      if (allEvents != null) {
        this._triggerEvents.apply(this, [allEvents, name].concat(__slice.call(args)));
      }
      return this;
    };

    Event.prototype.on = function(names, callback) {
      var events, name, nameArray, _i, _len;
      if (this._events == null) {
        this._events = {};
      }
      if (!_.isFunction(callback)) {
        throw new Error('Must have a valid function callback');
      }
      if (/\s/g.test(name)) {
        throw new Error('Illegal event name');
      }
      nameArray = names.split(' ');
      for (_i = 0, _len = nameArray.length; _i < _len; _i++) {
        name = nameArray[_i];
        events = this._events[name] || (this._events[name] = []);
        events.push({
          callback: callback,
          self: this
        });
      }
      return this;
    };

    Event.prototype.off = function(name, callback) {
      var event, events, key, names, newEvents, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      if (this._events == null) {
        this._events = {};
      }
      if (callback == null) {
        this._events = {};
        return this;
      }
      _ref = name.split(' ');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        events = (_ref1 = this._events[name]) != null ? _ref1 : [];
        names = name ? [name] : (function() {
          var _j, _len1, _ref2, _results;
          _ref2 = this._events;
          _results = [];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            key = _ref2[_j];
            _results.push(key);
          }
          return _results;
        }).call(this);
        for (_j = 0, _len1 = names.length; _j < _len1; _j++) {
          name = names[_j];
          newEvents = [];
          this._events[name] = newEvents;
          for (_k = 0, _len2 = events.length; _k < _len2; _k++) {
            event = events[_k];
            if (callback !== event.callback) {
              newEvents.push(event);
            }
          }
          if (newEvents.length === 0) {
            delete this._events[name];
          }
        }
      }
      return this;
    };

    Event.prototype._triggerEvents = function() {
      var args, event, events, _i, _len, _results;
      events = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      _results = [];
      for (_i = 0, _len = events.length; _i < _len; _i++) {
        event = events[_i];
        _results.push(event.callback.apply(event, args));
      }
      return _results;
    };

    return Event;

  })();

  Smackbone.Model = (function(_super) {
    __extends(Model, _super);

    function Model(attributes, options) {
      var key, modelClass, _ref;
      this._properties = {};
      this.cid = _.uniqueId('m');
      this.length = 0;
      this.idAttribute = 'id';
      this.changed = {};
      this._indexToModel = [];
      if (attributes != null) {
        this.set(attributes);
      }
      if (this.models != null) {
        _ref = this.models;
        for (key in _ref) {
          modelClass = _ref[key];
          if (!this.contains(key)) {
            this.set(key, new modelClass({}));
          }
        }
      }
      if (typeof this.initialize === "function") {
        this.initialize(attributes);
      }
    }

    Model.prototype.toJSON = function() {
      var key, properties;
      properties = _.clone(this._properties);
      for (key in this.transients) {
        delete properties[key];
      }
      return properties;
    };

    Model.prototype.isNew = function() {
      return this[this.idAttribute] == null;
    };

    Model.prototype.clone = function() {
      return new this.constructor(this._properties);
    };

    Model.prototype._createModelFromName = function(name, value, backupClass) {
      var modelClass, _ref, _ref1, _ref2, _ref3, _ref4;
      modelClass = (_ref = (_ref1 = (_ref2 = (_ref3 = this.modelClasses) != null ? _ref3[value[this.classField]] : void 0) != null ? _ref2 : (_ref4 = this.models) != null ? _ref4[name] : void 0) != null ? _ref1 : this.model) != null ? _ref : backupClass;
      if (modelClass != null) {
        return new modelClass(value);
      } else {
        return value;
      }
    };

    Model.prototype.move = function(currentId, nextId) {
      var o;
      o = this.get(currentId);
      if (o == null) {
        throw new ("Id '" + currentId + "' didn't exist.");
      }
      this.unset(currentId);
      return this.set(nextId, o);
    };

    Model.prototype.set = function(key, value, options) {
      var attributes, changeName, changedPropertyNames, current, existingObject, n, name, oldId, previous, v, _i, _len, _ref, _ref1;
      if (key == null) {
        throw new Error('can not set with undefined');
      }
      if (typeof key === 'object') {
        attributes = key;
        options = value;
        value = void 0;
      } else {
        (attributes = {})[key] = value;
      }
      if (attributes[this.idAttribute] != null) {
        oldId = this[this.idAttribute] || this.cid;
        this[this.idAttribute] = attributes[this.idAttribute];
        if ((_ref = this._parent) != null) {
          _ref.move(oldId, this[this.idAttribute]);
        }
      }
      this._previousProperties = _.clone(this._properties);
      current = this._properties;
      previous = this._previousProperties;
      changedPropertyNames = [];
      this.changed = {};
      for (name in attributes) {
        value = attributes[name];
        if (!_.isEqual(current[name], value)) {
          changedPropertyNames.push(name);
        }
        if (!_.isEqual(previous[name], value)) {
          this.changed[name] = value;
        }
        if ((((_ref1 = current[name]) != null ? _ref1.set : void 0) != null) && !(value instanceof Smackbone.Model) && (value != null)) {
          existingObject = current[name];
          existingObject.set(value);
        } else {
          if (!(value instanceof Smackbone.Model)) {
            value = this._createModelFromName(name, value);
          }
          current[name] = value;
          this.length = _.keys(current).length;
          if (value instanceof Smackbone.Model && (value._parent == null)) {
            value._parent = this;
            if (value[this.idAttribute] == null) {
              value[this.idAttribute] = name;
            }
          }
          this.trigger('add', value, this, options);
        }
      }
      this._indexToModel = (function() {
        var _ref2, _results;
        _ref2 = this._properties;
        _results = [];
        for (n in _ref2) {
          v = _ref2[n];
          _results.push(v);
        }
        return _results;
      }).call(this);
      for (_i = 0, _len = changedPropertyNames.length; _i < _len; _i++) {
        changeName = changedPropertyNames[_i];
        this.trigger("change:" + changeName, current[changeName], this, options);
      }
      if (changedPropertyNames.length > 0) {
        return this.trigger('change', this, options);
      }
    };

    Model.prototype.contains = function(key) {
      return this.get(key) != null;
    };

    Model.prototype.add = function(object) {
      return this.set(object);
    };

    Model.prototype.remove = function(object) {
      return this.unset(object);
    };

    Model.prototype.each = function(func) {
      var key, value, _ref, _results;
      _ref = this._properties;
      _results = [];
      for (key in _ref) {
        value = _ref[key];
        _results.push(func(value, key));
      }
      return _results;
    };

    Model.prototype.get = function(key) {
      var id, model, parts, _i, _len, _ref, _ref1;
      if (key == null) {
        throw new Error('Must have a valid object for get()');
      }
      if (typeof key === 'string') {
        if (key[key.length - 1] === '/') {
          key = key.slice(0, -1);
        }
        parts = key.split('/');
        model = this;
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          id = parts[_i];
          if (model == null) {
            throw new Error("Couldn't lookup '" + id + "' in '" + key + "'");
          }
          if (model instanceof Smackbone.Model) {
            model = model._properties[id];
          } else {
            model = model[id];
          }
        }
        return model;
      } else {
        return this._properties[(_ref = (_ref1 = key[this.idAttribute]) != null ? _ref1 : key.cid) != null ? _ref : key];
      }
    };

    Model.prototype.at = function(index) {
      return this._indexToModel[index];
    };

    Model.prototype.first = function() {
      return this.at(0);
    };

    Model.prototype.last = function() {
      return this.at(this._indexToModel.length - 1);
    };

    Model.prototype.unset = function(key, options) {
      var model, n, v, _ref, _ref1;
      key = (_ref = (_ref1 = key[this.idAttribute]) != null ? _ref1 : key.cid) != null ? _ref : key;
      model = this._properties[key];
      delete this._properties[key];
      this._indexToModel = (function() {
        var _ref2, _results;
        _ref2 = this._properties;
        _results = [];
        for (n in _ref2) {
          v = _ref2[n];
          _results.push(v);
        }
        return _results;
      }).call(this);
      this.length = _.keys(this._properties).length;
      if (model != null) {
        if (typeof model.trigger === "function") {
          model.trigger('unset', model, this, options);
        }
      }
      return this.trigger('remove', model, this, options);
    };

    Model.prototype.path = function() {
      var _ref, _ref1;
      if (this._parent != null) {
        return "" + (this._parent.path()) + "/" + ((_ref = this[this.idAttribute]) != null ? _ref : '');
      } else {
        return (_ref1 = this.rootPath) != null ? _ref1 : '';
      }
    };

    Model.prototype._root = function() {
      var i, model, _i;
      model = this;
      for (i = _i = 0; _i <= 10; i = ++_i) {
        if (model._parent == null) {
          break;
        }
        model = model._parent;
      }
      if (!model._parent) {
        return model;
      } else {
        console.warn("couldn't find root for:", this);
        return void 0;
      }
    };

    Model.prototype.fetch = function(queryObject, options) {
      this._root().trigger('fetch_request', this.path(), this, queryObject, options);
      return this.trigger('fetch', this, queryObject, options);
    };

    Model.prototype._triggerUp = function() {
      var args, i, model, name, path, _i, _ref, _results;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      model = this;
      path = '';
      _results = [];
      for (i = _i = 0; _i <= 20; i = ++_i) {
        if (model == null) {
          break;
        }
        model.trigger.apply(model, [name, path].concat(__slice.call(args)));
        path = "/" + ((_ref = model[this.idAttribute]) != null ? _ref : '') + path;
        _results.push(model = model._parent);
      }
      return _results;
    };

    Model.prototype.save = function(options) {
      this._root().trigger('save_request', this.path(), this, options);
      return this._triggerUp('up_save_request', this, options);
    };

    Model.prototype.destroy = function(options) {
      var _ref;
      this.trigger('destroy', this, options);
      if (!this.isNew()) {
        this._root().trigger('destroy_request', this.path(), this, options);
      }
      return (_ref = this._parent) != null ? _ref.remove(this) : void 0;
    };

    Model.prototype.reset = function(a, b, options) {
      var key, value, _ref;
      _ref = this._properties;
      for (key in _ref) {
        value = _ref[key];
        this.unset(key);
      }
      if (a != null) {
        this.set(a, b, options);
      }
      return this.trigger('reset', this, options);
    };

    Model.prototype.isEmpty = function() {
      return this.length === 0;
    };

    return Model;

  })(Smackbone.Event);

  Smackbone.Collection = (function(_super) {
    __extends(Collection, _super);

    function Collection() {
      _ref = Collection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Collection.prototype.create = function(object) {
      var model;
      model = this._createModelFromName(object.id, object);
      this.set(model);
      model.save();
      return model;
    };

    Collection.prototype.set = function(key, value) {
      var array, attributes, id, o, _i, _len, _ref1, _ref2;
      if (typeof key === 'object') {
        if (_.isEmpty(key)) {
          return;
        }
        array = _.isArray(key) ? array = key : array = [key];
        attributes = {};
        for (_i = 0, _len = array.length; _i < _len; _i++) {
          o = array[_i];
          id = (_ref1 = o[this.idAttribute]) != null ? _ref1 : o.cid;
          if (id == null) {
            o = this._createModelFromName(void 0, o, Smackbone.Model);
            id = (_ref2 = o[this.idAttribute]) != null ? _ref2 : o.cid;
          }
          if (o instanceof Smackbone.Model) {
            if (o._parent == null) {
              o._parent = this;
            }
          }
          attributes[id] = o;
        }
      } else {
        (attributes = {})[key] = value;
      }
      return Collection.__super__.set.call(this, attributes);
    };

    Collection.prototype.toJSON = function() {
      return _.toArray(Collection.__super__.toJSON.call(this));
    };

    return Collection;

  })(Smackbone.Model);

  Smackbone.Syncer = (function(_super) {
    __extends(Syncer, _super);

    function Syncer(options) {
      this._onDestroyRequest = __bind(this._onDestroyRequest, this);
      this._onSaveRequest = __bind(this._onSaveRequest, this);
      this._onFetchRequest = __bind(this._onFetchRequest, this);
      this.root = options.model;
      this.root.on('fetch_request', this._onFetchRequest);
      this.root.on('save_request', this._onSaveRequest);
      this.root.on('destroy_request', this._onDestroyRequest);
    }

    Syncer.prototype._onFetchRequest = function(path, model, queryObject, options) {
      var request,
        _this = this;
      options = options != null ? options : {};
      request = {
        type: 'GET',
        done: function(response) {
          var method;
          method = options.reset ? 'reset' : 'set';
          return model[method](response);
        }
      };
      return this._request(request, path, queryObject);
    };

    Syncer.prototype._onSaveRequest = function(path, model) {
      var options,
        _this = this;
      options = {
        type: model.isNew() ? 'POST' : 'PUT',
        data: model,
        done: function(response) {
          return model.set(response);
        }
      };
      return this._request(options, path);
    };

    Syncer.prototype._onDestroyRequest = function(path, model) {
      var options,
        _this = this;
      options = {
        type: 'DELETE',
        data: model,
        done: function(response) {
          return model.reset();
        }
      };
      return this._request(options, path);
    };

    Syncer.prototype._encodeQueryObject = function(queryObject) {
      var array, key, value;
      array = (function() {
        var _results;
        _results = [];
        for (key in queryObject) {
          value = queryObject[key];
          _results.push("" + key + "=" + value);
        }
        return _results;
      })();
      if (array.length) {
        return encodeURI('?' + array.join('&'));
      } else {
        return '';
      }
    };

    Syncer.prototype._request = function(options, path, queryObject) {
      var queryString, _ref1, _ref2;
      queryString = this._encodeQueryObject(queryObject);
      options.url = ((_ref1 = this.urlRoot) != null ? _ref1 : '') + path + queryString;
      if (options.type === 'GET') {
        options.data = void 0;
      } else {
        options.data = JSON.stringify((_ref2 = options.data) != null ? _ref2.toJSON() : void 0);
      }
      options.contentType = 'application/json';
      this.trigger('request', options);
      return Smackbone.$.ajax(options).done(options.done);
    };

    return Syncer;

  })(Smackbone.Event);

}).call(this);
