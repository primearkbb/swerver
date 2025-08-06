# swerver

It's got the swerve.

## What is swerver

Its a simple website for swerving, of course.

### What is swerving

I'm a guy with the url that I'd like to share.

I don't really want just anyone to know what the url is.

So - I'll swerve it.

1. User attempts to access `https://yourdomain.com/foo`
2. User authentication is checked.

* If user is authenticated, proceeds.
* If user is unauthenticated, redirects to authentication.

3. Once authenticated,  swerve checks to see if there is an active destination_share for this user.

* If there is not an active share, user is shown expired link screen
* If there is an active share, user is redirected.

### Examples

#### User, already authenticated & has active share

1. User clicks link
2. User is redirected to `destination_url`

#### User, already authenticated & no active share

1. User clicks link
2. User is redirected to `/expired`

#### User, not authenticated & has active share

1. User clicks link
2. User is redirected to `/login`
3. User successfully authenticates
4. User is redirected to `destination_url`

#### User, not authenticated & no active share

1. User clicks link
2. User is redirected to `/login`
3. User successfully authenticates
4. User is redirected to `/expired`

## Future enhancements

These are in consideration for future revisions.

1. Public shares: grant access to the worldwide web
2. Access request workflow: instead of `/expired` - give the user some capability of requesting access.
