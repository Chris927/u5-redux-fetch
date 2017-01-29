//@flow
import invariant from 'invariant'

// API Approach roughly taken from
// https://github.com/reactjs/redux/blob/master/examples/real-world/src/middleware/api.js
// Specifically implemented to support GraphQL queries and mutations

import 'isomorphic-fetch'

export default (config: {
  apiEndpoint: string | Function,
  symbol: string | Symbol
}) => {

  invariant(config.apiEndpoint, 'Need apiEndpoint in action')
  invariant(
    typeof config.apiEndpoint === 'string' || typeof config.apiEndpoint === 'function',
    'apiEndpoint must be a url or a function (producing a url)'
  )
  const apiEndpointFn = typeof config.apiEndpoint === 'string'
    ? () => config.apiEndpoint
    : config.apiEndpoint

  // Action key that carries API call info interpreted by this middleware.
  const CALL_API = config.symbol || Symbol('Call API')
  const API_REQUEST = config.requestAction || 'API_REQUEST'
  const API_ERROR = config.errorAction || 'API_ERROR'

  const apiErrorOccurred = config.apiErrorOccurred || (err => {
    console.log('api error', err)
    // alert('API Error: ' + err.message)
    return { type: API_ERROR, data: { message: err.message } }
  })

  // A Redux middleware that interprets actions with CALL_API info specified.
  // Performs the call and promises when such actions are dispatched.
  return store => next => action => {
    const callAPI = action[CALL_API]
    if (typeof callAPI === 'undefined') {
      return next(action)
    }

    console.log('api (1)', action)
    const { responseType, query, variables } = callAPI

    return Promise.resolve(apiEndpointFn())
    .then(apiEndpoint => {
      invariant(typeof responseType === 'string', 'Requires "responseType" of type string')
      invariant(typeof query === 'string', 'Requires "query" of type string')

      console.log('api', action)
      next({ type: API_REQUEST })
      return apiEndpoint
    }).then(apiEndpoint => fetch(apiEndpoint, {
      method: 'post',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        authorization: callAPI.authorization
      },
      body: JSON.stringify({ query, variables })
    })).then(response => {
      return Promise.all([ response, response.json() ])
    }).then(([ response, json]) => {

      console.log('json', json);

      const status = response.status
      const graphqlErrors = json.errors
      if (graphqlErrors) {
        throw new Error(graphqlErrors.map(e => e.message).join(', '))
      }
      if (status >= 300) {
        throw new Error(response.statusText || 'bad response')
      }

      return next({
        type: responseType,
        data: json.data,
        query,
        variables
      })

    }).catch(err => {
      console.log('api, err', err.stack)
      next(apiErrorOccurred(err))
    })

  }
}