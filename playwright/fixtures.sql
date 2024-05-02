-- test-user-unset-username
INSERT INTO "Users" (
	"_id",
	"email",
	"abTestKey",
	"usernameUnset"
) VALUES (
	'test-user-unset-username',
	'test-user-unset-username@testingaltrusim.org',
	'test-user-unset-username',
	TRUE
)
