require 'httparty'

class TripPlanner
	attr_accessor :routes

	def initialize(origin, destination)
		@routes = HTTParty.get("http://localhost:3000?origin=#{to_query(origin)}&destination=#{to_query(destination)}")
	end

	def to_query(str)
		str.gsub(' ', '+') + '+seattle'
	end
end
