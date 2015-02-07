require 'sinatra'
require 'httparty'

class HomeA2B < Sinatra::Base
	get '/' do
		erb :home
	end
end
