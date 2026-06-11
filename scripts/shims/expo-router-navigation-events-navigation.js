'use strict';

/**
 * Shim for expo-router's navigationEvents/navigation.js.
 * Metro can resolve require(".") to the wrong module, leaving emit undefined.
 */
const { emit } = require('../../node_modules/expo-router/build/navigationEvents/index.js');
const { storeRef } = require('../../node_modules/expo-router/build/global-state/store.js');

let unsubscribe;

function handleNavigationOnReady() {
  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = storeRef.current.navigationRef.addListener('__unsafe_action__', (event) => {
    if (!event.data.noop && storeRef.current.state) {
      const action = event.data.action;
      emit('actionDispatched', {
        actionType: action.type,
        payload: action.payload,
        state: storeRef.current.state,
      });
    }
  });
}

module.exports = { handleNavigationOnReady };
