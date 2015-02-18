require './lib/trip_planner'
require 'sinatra'

get '/' do
	haml :home
end
