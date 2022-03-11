/**
 * @rowanmanning/get-all-messages-in-a-slack-channel module
 * @module @rowanmanning/get-all-messages-in-a-slack-channel
 */
"use strict";

const { WebClient } = require("@slack/web-api");
const axios = require("axios");
const fs = require("fs");

/**
 * Get all of the messages in a Slack channel.
 *
 * @access public
 * @param {WebClient} slackWebApiClient
 *     A pre-authenticated Slack Web API client {@see https://www.npmjs.com/package/@slack/web-api}.
 * @param {String} slackChannelId
 *     The ID of the Slack channel to get all messages for.
 * @returns {Promise<Array<Object>>}
 *     Returns a promise that resolves to an array of Slack messages.
 * @throws {TypeError}
 *     Throws if any of the parameters are invalid.
 * @throws {Error}
 *     Throws if the Slack API errors.
 */
function getAllMessagesInASlackChannel(slackWebApiClient, slackChannelId) {
  if (!(slackWebApiClient instanceof WebClient)) {
    throw new TypeError(
      "`slackWebApiClient` must be an instance of Slack `WebClient`"
    );
  }
  if (!slackChannelId || typeof slackChannelId !== "string") {
    throw new TypeError(
      "`slackChannelId` must be slack channel ID as a string"
    );
  }
  return recurseOverChannelHistory(slackWebApiClient, slackChannelId);
}

/**
 * Recurse over a Slack channel's history.
 *
 * @access private
 * @param {WebClient} slackWebApiClient
 *     A pre-authenticated Slack Web API client {@see https://www.npmjs.com/package/@slack/web-api}.
 * @param {String} slackChannelId
 *     The ID of the Slack channel to get all messages for.
 * @param {Object} [state={result: []}]
 *     A private state object used in recursion.
 * @returns {Promise<Array<Object>>}
 *     Returns a promise that resolves to an array of Slack messages.
 * @throws {Error}
 *     Throws if the Slack API errors.
 */
async function recurseOverChannelHistory(
  slackWebApiClient,
  slackChannelId,
  state = { result: [] }
) {
  const apiCallOptions = {
    channel: slackChannelId,
    count: 100,
  };
  if (state.lastMessageTimestamp) {
    apiCallOptions.latest = state.lastMessageTimestamp;
  }
  const response = await slackWebApiClient.conversations.history(
    apiCallOptions
  );
  state.result = state.result.concat(response.messages);
  state.lastMessageTimestamp = state.result[state.result.length - 1].ts;
  if (response.has_more) {
    return recurseOverChannelHistory(slackWebApiClient, slackChannelId, state);
  }
  return state.result.reverse();
}

/**
 * Gets all Github issues comments and writes them in a file
 */
async function getAllGithubIssueComments(issue) {
  const { comments } = issue;

  // If issue has comments fetch all comments
  if (comments > 0) {
    const { comments_url: commentsUrl } = issue;

    try {
      const response = await axios.get(commentsUrl);
      const { data } = response;

      data.forEach((comment) => {
        const commentAsString = JSON.stringify(comment);
        fs.appendFileSync(
          "comments.data",
          commentAsString + "\n",
          (appendErr) => {
            if (appendErr) return console.log(appendErr);
          }
        );
      });
    } catch (errFetch) {
      console.error("Error fetching Github issues comments.");
    }
  }
}

/**
 * Gets and writes to a file all GitHub issues in Materialize
 */
async function getAllGithubIssues() {
  let fetchSize = -1;
  let page = 0;

  const perPage = 100;

  while (fetchSize !== 0) {
    console.log("Fetching page: ", page);
    console.log("Sleeping to not make Github angry.");

    /**
     * Sleep ZzZzZzZ
     */
    await new Promise((res) =>
      setTimeout(() => {
        res();
      }, 2000)
    );

    try {
      const response = await axios.get(
        `https://api.github.com/repos/MaterializeInc/materialize/issues?page=${page}&per_page=${perPage}`
      );
      const { data } = response;

      /**
       * Process the issues
       */
      data.forEach((issue) => {
        getAllGithubIssueComments(issue);

        const issueAsString = JSON.stringify(issue);

        fs.appendFileSync("issues.data", issueAsString + "\n", (appendErr) => {
          if (appendErr) return console.log(appendErr);
        });
      });

      fetchSize = data.length;
      page += 1;
    } catch (fetchError) {
      console.error("Error fetching Github issues.");
      throw new Error(fetchError);
    }
  }
}

getAllGithubIssues();
module.exports = getAllMessagesInASlackChannel;
