require 'sinatra'
require 'dotenv'
require 'haml'
require 'better_errors'
require './lib/trip_planner'

Dotenv.load

get '/' do
	haml :home
end
