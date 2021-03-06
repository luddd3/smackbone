
	class Smackbone.Collection extends Smackbone.Model

		create: (object) ->
			model = @_createModelFromName object.id, object
			@set model
			model.save()
			model

If the receiver is a collection, then it uses the id of the objects to set the properties.

		set: (key, value) ->
			if typeof key is 'object'

Todo: Should make test to make sure why checking for isEmpty is needed for some situations

				return if _.isEmpty key

				array = if _.isArray key then array = key else array = [key]
				attributes = {}
				for o in array
					id = o[@idAttribute] ? o.cid
					if not id?
						o = @_createModelFromName undefined, o, Smackbone.Model
						id = o[@idAttribute] ? o.cid

					if o instanceof Smackbone.Model
						o._parent = @ if not o._parent?
					attributes[id] = o
			else
				(attributes = {})[key] = value

			super attributes

		toJSON: ->
			_.toArray super()
