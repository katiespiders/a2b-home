require 'sinatra'
require 'dotenv'
require './lib/trip_planner'

Dotenv.load

get '/' do
	erb :home
end

post '/form' do
	@trip = TripPlanner.new #(params[:pointA], params[:pointB])
	erb :trips
end
