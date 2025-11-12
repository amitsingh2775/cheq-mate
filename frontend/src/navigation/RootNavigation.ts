import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const rootNavigationRef = createNavigationContainerRef();

export function navigateToNested(rootName: string, screenName: string, params?: object) {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.dispatch(
      CommonActions.navigate({
        name: rootName,
        params: {
          screen: screenName,
          params,
        },
      })
    );
  }
}
