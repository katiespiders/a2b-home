require 'sinatra'
require 'dotenv'
require './lib/trip_planner'

Dotenv.load

get '/' do
	erb :home
end

post '/form' do
	puts "*"*80, "NEW TRIP FROM #{params[:pointA]} to #{params[:pointB]}"
	@trip = TripPlanner.new(params[:pointA], params[:pointB])
	@car = Car.new(@trip.car)
	@walk = Walk.new(@trip.walk)
	@transit = Transit.new(@trip.transit)
	erb :trips
end
