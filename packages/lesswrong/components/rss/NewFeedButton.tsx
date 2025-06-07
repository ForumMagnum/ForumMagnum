import React from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCurrentUser } from '../common/withUser';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import Loading from "../vulcan-core/Loading";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import MetaInfo from "../common/MetaInfo";
import { useMutation } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/crud/wrapGql";

const RSSFeedMinimumInfoMultiQuery = gql(`
  query multiRSSFeedNewFeedButtonQuery($selector: RSSFeedSelector, $limit: Int, $enableTotal: Boolean) {
    rSSFeeds(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...RSSFeedMinimumInfo
      }
      totalCount
    }
  }
`);

const newRSSFeedFragmentMutation = gql(`
  mutation createRSSFeedNewFeedButton($data: CreateRSSFeedDataInput!) {
    createRSSFeed(data: $data) {
      data {
        ...newRSSFeedFragment
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16
  },
  feed: {
    ...theme.typography.body2,
  }
})

const formStyles = defineStyles('RSSFeedsForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

const RSSFeedsForm = ({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: (doc: newRSSFeedFragment) => void;
}) => {
  const classes = useStyles(formStyles);

  const [create] = useMutation(newRSSFeedFragmentMutation);

  const defaultValues: Required<Omit<CreateRSSFeedDataInput, 'legacyData'>> = {
    nickname: '',
    url: '',
    userId,
    ownedByUser: null,
    displayFullContent: null,
    setCanonicalUrl: null,
    importAsDraft: null,
    rawFeed: null,
  };

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        let result: newRSSFeedFragment;

        const { data } = await create({ variables: { data: value } });
        if (!data?.createRSSFeed?.data) {
          throw new Error('Failed to create RSS feed');
        }
        result = data.createRSSFeed.data;

        onSuccess(result);
        setCaughtError(undefined);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  return (
    <form className="vulcan-form" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {displayedErrorComponent}
      <div className={classes.fieldWrapper}>
        <form.Field name="nickname">
          {(field) => (
            <MuiTextField
              field={field}
              label="Nickname"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="url">
          {(field) => (
            <MuiTextField
              field={field}
              label="Url"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="ownedByUser">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Owned by user"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="displayFullContent">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Display full content"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="setCanonicalUrl">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Set the canonical url tag on crossposted posts"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="importAsDraft">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Import posts as draft"
            />
          )}
        </form.Field>
      </div>

      <div className="form-submit">
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={classNames("primary-form-submit-button", classes.submitButton)}
            >
              Submit
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};

//
// Button used to add a new feed to a user profile
//
const NewFeedButton = ({classes, user, closeModal}: {
  classes: ClassesType<typeof styles>,
  user: UsersProfile,
  closeModal?: any
}) => {
  const currentUser = useCurrentUser();
  const { data, loading } = useQuery(RSSFeedMinimumInfoMultiQuery, {
    variables: {
      selector: { usersFeed: { userId: user._id } },
      limit: 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const feeds = data?.rSSFeeds?.results;
  
  if (currentUser) {
    return (
      <div className={classes.root}>
        {loading && <Loading/>}
        {feeds?.map(feed => <div key={feed._id} className={classes.feed}>
          <MetaInfo>Existing Feed:</MetaInfo>
          <div><a href={feed.url}>{feed.nickname}</a></div>
        </div>)}
        {/* TODO: test this one at all */}
        <RSSFeedsForm
          userId={user._id}
          onSuccess={() => {
            closeModal();
          }}
        />
        {/*FIXME: This close button doesn't work (closeModal is not a thing)*/}
        <Button onClick={() => closeModal()}>Close</Button>
      </div>
    )
  } else {
    return <div> <Loading /> </div>
  }
}

export default registerComponent('NewFeedButton', NewFeedButton, {styles});


