source 'https://rubygems.org'

ruby '>= 2.6.10'

gem 'activesupport', '>= 6.1.7.5', '!= 7.1.0'
gem 'cocoapods', '>= 1.13', '!= 1.15.0', '!= 1.15.1'
gem 'fastlane'
gem 'nokogiri', '~> 1.15.5'

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
