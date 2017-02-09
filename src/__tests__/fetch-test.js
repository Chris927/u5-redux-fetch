import configureMockStore from 'redux-mock-store'

import apiMiddleware from '..'

const CALL_API = 'CALL_API'

const API_QUERY_REQUESTED = 'API_QUERY_REQUESTED'
const QUERY1_RECEIVED = 'QUERY1_RECEIVED'

const middlewares = [ apiMiddleware({
  apiEndpoint: 'http://my-api.test.com/some-graphql-api',
  symbol: CALL_API,
  requestAction: API_QUERY_REQUESTED
}) ]
const mockStore = configureMockStore(middlewares)

describe('middleware', () => {

  const expectedData = { bla: 42 }

  it('dispatches a "request" action', () => {

    const expectedActions = [
      { type: API_QUERY_REQUESTED },
      {
        type: QUERY1_RECEIVED,
        data: expectedData,
        query: 'query 1',
        values: { some: 'value' }
      }
    ]
    const store = mockStore({})

    fetch.mockResponse(JSON.stringify({ data: expectedData }))
    return store.dispatch({
      type: 'this type should not matter',
      [CALL_API]: {
        responseType: QUERY1_RECEIVED,
        query: 'query 1',
        variables: { some: 'value' },
        authorization: 'Bearer 123'
      }
    }).then(() => {
      expect(store.getActions()).toEqual(expectedActions)
    })
  })

  it('dispatches a full action on success, if given', () => {

    const additionalProp = { key: 'value' }

    const expectedActions = [
      { type: API_QUERY_REQUESTED },
      {
        type: 'MY_SUCCESS_ACTION',
        additionalProp: { key: 'value'},
        data: expectedData,
        query: 'query 1',
        values: { some: 'value' }
      }
    ]
    const store = mockStore({})

    fetch.mockResponse(JSON.stringify({ data: expectedData }))
    return store.dispatch({
      type: 'this type should not matter',
      [CALL_API]: {
        successAction: {
          type: 'MY_SUCCESS_ACTION',
          additionalProp
        },
        query: 'query 1',
        variables: { some: 'value' },
        authorization: 'Bearer 123'
      }
    }).then(() => {
      expect(store.getActions()).toEqual(expectedActions)
    })

  })
})
