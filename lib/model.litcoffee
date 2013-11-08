
	class Smackbone.Model extends Smackbone.Event

		constructor: (attributes, options) ->
			@_properties = {}
			@cid = _.uniqueId 'm'
			@length = 0
			@idAttribute = 'id'
			@changed = {}
			@_indexToModel = []
			@set attributes if attributes?
			if @models?
				for key, modelClass of @models
					if not @contains key
						@set key, new modelClass {}
			@initialize? attributes

		toJSON: ->
			_.clone @_properties

		isNew: ->
			not @[@idAttribute]?

		clone: ->
			new @constructor @_properties

		_createModelFromName: (name, value, backupClass) ->
			modelClass = @modelClasses?[value[@classField]] ? @models?[name] ? @model ? backupClass
			if modelClass? then new modelClass value else value

		move: (currentId, nextId) ->
			o = @get currentId
			throw new "Id '#{currentId}' didn't exist." if not o?
			@unset currentId
			@set nextId, o

		set: (key, value) ->
			throw new Error 'can not set with undefined' if not key?

			if typeof key is 'object'
				attributes = key
			else
				(attributes = {})[key] = value

			if attributes[@idAttribute]?
				oldId = @[@idAttribute] or @cid
				@[@idAttribute] = attributes[@idAttribute]
				@_parent?.move oldId, @[@idAttribute]

			@_previousProperties = _.clone @_properties
			current = @_properties
			previous = @_previousProperties

			changedPropertyNames = []
			@changed = {}

			for name, value of attributes
				if current[name] isnt value
					changedPropertyNames.push name

				if previous[name] isnt value
					@changed[name] = value

				if current[name]?.set? and not (value instanceof Smackbone.Model) and value?
					existingObject = current[name]
					existingObject.set value
				else
					if not (value instanceof Smackbone.Model)
						value = @_createModelFromName name, value
					current[name] = value
					@_indexToModel.push value
					@length = _.keys(current).length

					if value instanceof Smackbone.Model and not value._parent?
						value._parent = @
						if not value[@idAttribute]?
							value[@idAttribute] = name

					@trigger 'add', value, @

			for changeName in changedPropertyNames
				@trigger "change:#{changeName}", current[changeName], @

			@trigger 'change', @ if changedPropertyNames.length > 0

		contains: (key) ->
			@get(key)?

		add: (object) ->
			@set object

		remove: (object) ->
			@unset object

		each: (func) ->
			func value, key for key, value of @_properties

		get: (key) ->
			throw new Error 'Must have a valid object for get()' if not key?
			if typeof key is 'string'
				parts = key.split '/'
				model = @
				for id in parts
					if model instanceof Smackbone.Model
						model = model._properties[id]
					else
						model = model[id]
				model
			else
				@_properties[key[@idAttribute] ? key.cid ? key]

		at: (index) ->
			@_indexToModel[index]

		first: ->
			@at 0

		last: ->
			@at @_indexToModel.length - 1

		unset: (key) ->
			key = key[@idAttribute] ? key.cid ? key
			model = @_properties[key]
			index = _.indexOf @_indexToModel, model
			@_indexToModel.splice index, 1
			delete @_properties[key]
			@length = _.keys(@_properties).length
			model?.trigger? 'unset', model
			@trigger 'remove', model, @

		path: ->
			if @_parent? then "#{@_parent.path()}/#{@[@idAttribute] ? ''}" else @rootPath ? ''

		_root: ->
			model = @
			for i in [0..10]
				if not model._parent?
					break
				model = model._parent

			if not model._parent
				model
			else
				console.warn "couldn't find root for:", @
				undefined

		fetch: (queryObject, options) ->
			@_root().trigger 'fetch_request', @path(), @, queryObject, options
			@trigger 'fetch', @, queryObject, options

		_triggerUp: (name, args...) ->
			model = @
			path = ''
			for i in [0..20]
				if not model?
					break
				model.trigger name, path, args...
				path = "/#{model[@idAttribute] ? ''}#{path}"
				model = model._parent

		save: ->
			@_root().trigger 'save_request', @path(), @
			@_triggerUp 'up_save_request', @

		destroy: ->
			@trigger 'destroy', @
			if not @isNew()
				@_root().trigger 'destroy_request', @path(), @
			@_parent?.remove @

		reset: (a, b) ->
			@unset key for key, value of @_properties
			@set a, b if a?
			@trigger 'reset', @

		isEmpty: ->
			@length is 0
