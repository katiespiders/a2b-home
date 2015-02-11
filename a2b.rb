require 'sinatra'
require './lib/trip_planner'

get '/' do
	erb :home
end

post '/form' do
	@trip = TripPlanner.new(params[:pointA], params[:pointB])
	redirect to('/trips'), @trip
end

get '/trips' do
	erb :trips
end
