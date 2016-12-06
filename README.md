# Actions On Google Facts about Google Sample for Node.js
==================================================

This sample shows how to create an action for the Google Assistant using API.AI


## Setup Instructions

# Pre-requisites
 1. API.AI: [https://api.ai](https://api.ai)

See the developer guide and release notes at https://developers.google.com/actions/ for more details.

# Steps:
1. Create a new API.AI agent at http://api.ai
1. In your agent settings, navigate to Export and Import
1. Click Import from Zip
1. Choose the FactsAboutGoogle.zip, included in this repository
1. Follow the directions to import
1. See the new intents in your project
1. Enable the Actions on Google integration and set the following intents as Additional triggers
    * choose_cats
    * choose_google
1. In the ```quit``` intent, mark End Conversation for Actions on Google
1. Make sure all domains are turned off
1. Deploy the app to your preferred hosting environment (we recommend Google App Engine)
1. In the Fulfillment page, enable Fulfillment and specify the deployment URL
1. For the following intents, make sure fulfillment is enabled
    * choose_cats
    * choose_google
    * say_cat_fact
    * say_google_fact

## Documentation
* Actions on Google: https://developers.google.com/actions/

## References and How to report bugs
* If you find any issues, please open a bug here on GitHub

How to make contributions?
Please read and follow the steps in the CONTRIBUTING.md

License
See LICENSE.md

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/) and the [Actions On Google Developer Terms of Service](https://developers.google.com/actions/docs/terms/).

## Google+
Actions on Google Developers Community on Google+ [http://g.co/actionsdev](http://g.co/actionsdev)
