import React from 'react';
import PropTypes from 'prop-types';
import { Components, replaceComponent, withCurrentUser } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import FlatButton from 'material-ui/FlatButton';

const commentFonts = '"freight-sans-pro", Frutiger, "Frutiger Linotype", Univers, Calibri, "Gill Sans", "Gill Sans MT", "Myriad Pro", Myriad, "DejaVu Sans Condensed", "Liberation Sans", "Nimbus Sans L", Tahoma, Geneva, "Helvetica Neue", Helvetica, Arial, sans-serif';


const FormSubmit = ({
                      submitLabel,
                      cancelLabel,
                      cancelCallback,
                      document,
                      deleteDocument,
                      collectionName,
                      classes,
                      currentUser
                    },
                    {
                      updateCurrentValues,
                      addToDeletedValues
                    }) => (
  <div className="form-submit">

    {collectionName === "posts" && <span className="post-submit-buttons">
      { !document.isEvent &&
        !document.meta &&
        Users.canDo(currentUser, 'posts.curate.all') && <FlatButton
        type="submit"
        hoverColor={"rgba(0, 0, 0, 0.05)"}
        style={{paddingBottom: "2px", marginLeft: "5px", fontFamily: commentFonts}}
        label={document.frontpageDate ? "Move to personal blog" : "Submit to frontpage" }
        labelStyle={{fontSize: "16px" , color: "rgba(0,0,0,0.4)"}}
        onTouchTap={() => {
          updateCurrentValues({frontpageDate: document.frontpageDate ? null : new Date(), draft: false});
          if (document.frontpageDate) {addToDeletedValues('frontpageDate')}
        }
        }/>}

      <FlatButton
        type="submit"
        hoverColor={"rgba(0, 0, 0, 0.05)"}
        style={{paddingBottom: "2px", fontFamily: commentFonts}}
        label={"Save as draft"}
        labelStyle={{fontSize: "16px" , color: "rgba(0,0,0,0.4)"}}
        onTouchTap={() => updateCurrentValues({draft: true})}/>

      {Users.canDo(currentUser, 'posts.curate.all') && !document.meta && <FlatButton
        type="submit"
        hoverColor={"rgba(0, 0, 0, 0.05)"}
        style={{paddingBottom: "2px", marginLeft: "5px", fontFamily: commentFonts}}
        label={document.curatedDate ? "Remove from curated" : "Promote to curated"}
        labelStyle={{fontSize: "16px" , color: "rgba(0,0,0,0.4)"}}
        onTouchTap={() => {
          updateCurrentValues({curatedDate: document.curatedDate ? null : new Date()})
          if (document.curatedDate) {addToDeletedValues('curatedDate')}}
        }/>
      }
    </span>}

    {
        cancelCallback
          ?
            <FlatButton
              className="form-cancel"
              hoverColor={"rgba(0, 0, 0, 0.05)"}
              style={{paddingBottom: "2px", fontFamily: commentFonts}}
              onTouchTap={(e) => {e.preventDefault(); cancelCallback(document)}}
              label={"Cancel"}
              labelStyle={{fontSize: "16px" , color: "rgba(0,0,0,0.4)"}}
            />
          : null
    }

    <FlatButton
      type="submit"
      className="primary-form-submit-button"
      hoverColor={"rgba(0, 0, 0, 0.05)"}
      style={{paddingBottom: "2px", marginLeft: "5px", fontFamily: commentFonts}}
      onTouchTap={() => collectionName === "posts" && updateCurrentValues({draft: false})}
      label={"Submit" }
      labelStyle={{fontSize: "16px", color: "rgba(100, 169, 105, 0.9)"}}
    />

    {/* <Button type="submit" bsStyle="primary">
      {submitLabel ? submitLabel : <FormattedMessage id="forms.submit"/>}
    </Button> */}

    {collectionName === "comments" && document && document.postId && <span className="comment-submit-buttons">
      <Components.ModerationGuidelinesLink showModeratorAssistance documentId={document.postId}/>
      {/* <div className="comment-editor-moderation-guidelines">

      </div> */}
    </span>}



  </div>
);


FormSubmit.propTypes = {
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  cancelCallback: PropTypes.func,
  document: PropTypes.object,
  deleteDocument: PropTypes.func,
  collectionName: PropTypes.string,
  classes: PropTypes.object,
};

FormSubmit.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToDeletedValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
}


replaceComponent('FormSubmit', FormSubmit, withCurrentUser);
