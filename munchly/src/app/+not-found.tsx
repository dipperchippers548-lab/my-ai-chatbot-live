import { Redirect } from 'expo-router';

/** Any unknown address (old links, a page hosted under a sub-path) goes to the home screen. */
export default function NotFound() {
  return <Redirect href="/" />;
}
