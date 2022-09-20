import { noop } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import usePermissions from '../../../components/permissions/hooks/usePermissions'
import { Permissions } from '../../../components/permissions/types'
import { NotificationsAPI } from '../api/NotificationsApi'

export const getNotificationPayload = notification => {
  const field = Platform.select({
    ios: 'payload',
    android: 'data',
  })

  return (notification || {})[field]
}

export const getCategory = notification => {
  const payload = getNotificationPayload(notification)

  const { category } = payload || {}

  return category
}

export const useNotificationsSupport = () => {
  const [supportedState, setSupportedState] = useState('')
  const supported = useMemo(() => supportedState === true, [supportedState])
  const unsupported = useMemo(() => supportedState === false, [supportedState])

  useEffect(() => {
    NotificationsAPI.isSupported()
      .catch(() => false)
      .then(setSupportedState)
  }, [setSupportedState])

  return [supported, unsupported]
}

export const useNotificationsStateSwitch = (storeProp, updateState, options = {}) => {
  const { onPermissionRequest = noop, ...requestOpts } = options
  const enabled = useMemo(() => !!storeProp, [storeProp])
  const _onAllowed = useCallback(() => {
    updateState(true)
  }, [updateState])

  const [allowed, requestPermission] = usePermissions(Permissions.Notifications, {
    onAllowed: _onAllowed,
    requestOnMounted: false,
    ...requestOpts,
  })

  const toggleEnabled = useCallback(
    newState => {
      if (newState === enabled) {
        return
      }

      if (newState && !allowed) {
        requestPermission(onPermissionRequest() || {})
        return
      }

      updateState(newState)
    },
    [allowed, enabled, requestPermission, updateState, onPermissionRequest],
  )

  return [enabled, toggleEnabled]
}
