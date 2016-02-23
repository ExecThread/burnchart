import _ from 'lodash';
import superagent from 'superagent';

import actions from '../../actions/appActions.js';

import config from '../../../config.js';

// Custom JSON parser.
superagent.parse = {
  'application/json': (res) => {
    try {
      return JSON.parse(res);
    } catch(err) {
      return {};
    }
  }
};

// Default args.
let defaults = {
  'github': {
    'host': 'api.github.com',
    'protocol': 'https'
  }
};

// Public api.
export default {

  // Get a repo.
  repo: (user, { owner, name }, cb) => {
    let token = (user && user.github != null) ? user.github.accessToken : null;
    let data = _.defaults({
      'path': `/repos/${owner}/${name}`,
      'headers': headers(token)
    }, defaults.github);

    request(data, cb);
  },

  // Get repos user has access to or are public to owner.
  repos: (user, ...args) => {
    if (args.length = 2) {
      var [ owner, cb ] = args;
    } else { // assumes 1
      var [ cb ]  = args;
    }

    let token = (user && user.github != null) ? user.github.accessToken : null;
    let data = _.defaults({
      'path': owner ? `/users/${owner}/repos` : '/user/repos',
      'headers': headers(token)
    }, defaults.github);

    request(data, cb);
  },

  // Get all open milestones.
  allMilestones: (user, { owner, name }, cb) => {
    let token = (user && user.github != null) ? user.github.accessToken : null;
    let data = _.defaults({
      'path': `/repos/${owner}/${name}/milestones`,
      'query': { 'state': 'open', 'sort': 'due_date', 'direction': 'asc' },
      'headers': headers(token)
    }, defaults.github);

    request(data, cb);
  },

  // Get one open milestone.
  oneMilestone: (user, { owner, name, milestone }, cb) => {
    let token = (user && user.github != null) ? user.github.accessToken : null;
    let data = _.defaults({
      'path': `/repos/${owner}/${name}/milestones/${milestone}`,
      'query': { 'state': 'open', 'sort': 'due_date', 'direction': 'asc' },
      'headers': headers(token)
    }, defaults.github);

    request(data, cb);
  },

  // Get all issues for a state..
  allIssues: (user, { owner, name, milestone }, query, cb) => {
    if(query.state === 'readytomerge')
    {
        query.state = 'open';
        query.labels='4%20-%20Ready%20To%20Merge';
    }
    else if(query.state === 'reviewnotify')
    {
        query.state = 'open';
        query.labels='5%20-%20Review%2FNotify';
    }
    let token = (user && user.github != null) ? user.github.accessToken : null;
    let data = _.defaults({
      'path': `/repos/${owner}/${name}/issues`,
      'query': _.extend(query, { milestone, 'per_page': '100' }),
      'headers': headers(token)
    }, defaults.github);

    return request(data, cb);
  }

};

// Make a request using SuperAgent.
let request = ({ protocol, host, path, query, headers }, cb) => {
  let exited = false;

  // Make the query params.
  let q = '';
  if (query) {
    q = '?' + _.map(query, (v, k) => { return `${k}=${v}`; }).join('&');
  }

  // The URI.
  let req = superagent.get(`${protocol}://${host}${path}${q}`);
  // Add headers.
  _.each(headers, (v, k) => { req.set(k, v); });

  // Timeout for requests that do not finish... see #32.
  let timeout = setTimeout(() => {
    exited = true;
    cb('Request has timed out');
  }, config.request.timeout);

  // Send.
  req.end((err, data) => {
    // Arrived too late.
    if (exited) return;
    // All fine.
    exited = true;
    clearTimeout(timeout);
    // Actually process the response.
    response(err, data, cb);
  });
};

// How do we respond to a response?
let response = (err, data, cb) => {
  if (err) return cb(error(data.body || err));
  // 2xx?
  if (data.statusType !== 2) return cb(error(data.body));
  // All good.
  cb(null, data.body);
};

// Give us headers.
let headers = (token) => {
  // The defaults.
  let h = {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3'
  };
  // Add token?
  if (token) h.Authorization = `token ${token}`;

  return h;
};

// Parse an error.
let error = (err) => {
  let text, type;

  switch (false) {
    case !_.isString(err):
      text = err;
      break;

    case !_.isArray(err):
      text = err[1];
      break;

    case !(_.isObject(err) && _.isString(err.message)):
      text = err.message;
  }

  if (!text) {
    try {
      text = JSON.stringify(err);
    } catch (_err) {
      text = err.toString();
    }
  }

  return text;
};
