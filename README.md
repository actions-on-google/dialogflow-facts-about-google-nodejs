# Actions on Google Facts about Google Sample using Node.js

This is a knowledgable Action that shares interesting facts about Google.
The sample introduces advanced features like custom entities, contexts,
and deep links. Use this Action and you might see that it even knows about a
subject other than Google!

## Setup Instructions

### Pre-requisites
 1. API.AI account: [https://api.ai](https://api.ai)
 2. Google Cloud project: [https://console.cloud.google.com/project](https://console.cloud.google.com/project)

See the developer guide and release notes at [https://developers.google.com/actions/](https://developers.google.com/actions/) for more details.

### Steps
 1. Create a new agent in API.AI [https://api.ai](https://api.ai).
 1. Click on the project gear icon to see the project settings.
 1. Select "Export and Import".
 1. Select "Restore from zip". Follow the directions to restore.
 1. Select the FactsAboutGoogle.zip file in this repo.
 1. Deploy this app to your preferred hosting environment (we recommend Google App Engine).
 1. Set the "Fulfillment" webhook URL to the hosting URL.
 1. Make sure all domains are turned off.
 1. Enable Actions on Google in the Integrations.
 1. Enter the following intents as "Additional triggering intents"
     * choose_google
     * choose_cats
 1. In the quit_facts intent, check "End Conversation" for Actions on Google.
 1. Provide an invocation name for the action.
 1. Authorize and preview the action in the [web simulator](https://developers.google.com/actions/tools/web-simulator).

For more detailed information on deployment, see the [documentation](https://developers.google.com/actions/samples/).

## References and How to report bugs
* Actions on Google documentation: [https://developers.google.com/actions/](https://developers.google.com/actions/).
* If you find any issues, please open a bug here on GitHub.
* Questions are answered on [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google).

## How to make contributions?
Please read and follow the steps in the CONTRIBUTING.md.

## License
See LICENSE.md.

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).

## Google+
Actions on Google Developers Community on Google+ [https://g.co/actionsdev](https://g.co/actionsdev).
