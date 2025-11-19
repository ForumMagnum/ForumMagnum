import React, { useCallback } from "react";
import { useCurrentUser } from "../../common/withUser";
import { useLocation, useNavigate } from "../../../lib/routeUtil";
import { useMessages } from "../../common/withMessages";
import { useDialog } from "../../common/withDialog";
import { Link } from "../../../lib/reactRouterWrapper";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import Error404 from "@/components/common/Error404";
import SectionTitle from "@/components/common/SectionTitle";
import EAButton from "@/components/ea-forum/EAButton";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useForm } from "@tanstack/react-form";
import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { useSingle } from "@/lib/crud/withSingle";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { TagSelect } from "@/components/form-components/TagSelect";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import Loading from "@/components/vulcan-core/Loading";
import InputLabel from "@/lib/vendor/@material-ui/core/src/InputLabel";
import DeleteElectionCandidateDialog from "./DeleteElectionCandidateDialog";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    margin: "0 auto",
    padding: "0 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "20px",
    width: 600,
    maxWidth: "100%",
  },
  link: {
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: '22px',
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
});

const ELECTION_OPTIONS = [
  { value: "givingSeason24", label: "EA Giving Season 2024" },
  { value: "givingSeason25", label: "EA Giving Season 2025" },
];

const EditElectionCandidate = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {flash} = useMessages();
  const navigate = useNavigate();
  const {openDialog} = useDialog();
  const {params} = useLocation();
  const candidateId = params.id;
  const isNewForm = candidateId === "new";

  const currentUser = useCurrentUser();

  const { document: existingCandidate, loading: loadingCandidate } = useSingle({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
    documentId: candidateId,
    skip: isNewForm,
  });

  const { create } = useCreate({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
  });

  const { mutate } = useUpdate({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      electionName: existingCandidate?.electionName ?? "givingSeason25",
      name: existingCandidate?.name ?? "",
      logoSrc: existingCandidate?.logoSrc ?? "",
      href: existingCandidate?.href ?? "",
      description: existingCandidate?.description ?? "",
      tagId: existingCandidate?.tagId ?? null,
    },
    onSubmit: async ({ formApi }) => {
      try {
        let result: ElectionCandidateBasicInfo;

        if (isNewForm) {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createElectionCandidate.data;
        } else {
          const { data } = await mutate({
            selector: { _id: candidateId },
            data: formApi.state.values,
          });
          result = data?.updateElectionCandidate.data;
        }

        flash("Success");
        navigate({ pathname: "/admin/election-candidates" });
        setCaughtError(undefined);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  const deleteCallback = useCallback(() => {
    if (!isNewForm) {
      openDialog({
        name: "DeleteElectionCandidateDialog",
        contents: ({onClose}) => <DeleteElectionCandidateDialog onClose={onClose} candidateId={candidateId} />
      });
    }
  }, [isNewForm, openDialog, candidateId]);

  if (!userIsAdmin(currentUser)) {
    return (
      <Error404 />
    );
  }

  if (!isNewForm && loadingCandidate) {
    return <Loading />;
  }

  return (
    <div className={classes.root}>
      <SectionTitle
        title={`${isNewForm ? "New" : "Edit"} election candidate`}
      />
      {displayedErrorComponent}
      <form 
        className={classes.form}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="electionName">
          {(field) => (
            <FormComponentSelect
              field={field}
              options={ELECTION_OPTIONS}
              label="Election"
              hideClear
            />
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <MuiTextField
              field={field}
              label="Candidate name"
            />
          )}
        </form.Field>

        <form.Field name="logoSrc">
          {(field) => (
            <MuiTextField
              field={field}
              label="Logo image URL"
            />
          )}
        </form.Field>

        <form.Field name="href">
          {(field) => (
            <MuiTextField
              field={field}
              label="Candidate website URL"
            />
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <MuiTextField
              field={field}
              label="Candidate description"
              rows={4}
            />
          )}
        </form.Field>

        <form.Field name="tagId">
          {(field) => (
            <div>
              <InputLabel>Tag (type to search)</InputLabel>
              <TagSelect field={field} label="Search for tag..." />
            </div>
          )}
        </form.Field>

        <div className={classes.buttonGroup}>
          <EAButton type="submit" variant="contained" color="primary">
            {isNewForm ? "Create" : "Save"}
          </EAButton>
          {!isNewForm && (
            <EAButton onClick={deleteCallback} variant="outlined">
              Delete
            </EAButton>
          )}
        </div>
      </form>

      <div>
        <Link to="/admin/election-candidates" className={classes.link}>
          Back to election candidates
        </Link>
      </div>
    </div>
  );
}

export default registerComponent(
  "EditElectionCandidate",
  EditElectionCandidate,
  {styles},
);
