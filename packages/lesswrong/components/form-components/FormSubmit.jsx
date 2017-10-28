import React from 'react';
import PropTypes from 'prop-types';
import { Components } from 'meteor/vulcan:core';
import { replaceComponent } from 'meteor/vulcan:core';
import Button from 'react-bootstrap/lib/Button';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import FlatButton from 'material-ui/FlatButton';


const FormSubmit = ({
                      submitLabel,
                      cancelLabel,
                      cancelCallback,
                      document,
                      deleteDocument,
                      collectionName,
                      classes
                    }, {addToAutofilledValues}) => (
  <div className="form-submit">

    {collectionName === "posts" && <span className="post-submit-buttons">
      <FlatButton
        type="submit"
        backgroundColor={"#bbb"}
        hoverColor={"#ccc"}
        style={{color: "#fff",marginLeft: "5px"}}
        label={document.frontpage ? "Move to personal blog" : "Submit to frontpage" }
        onTouchTap={() => addToAutofilledValues({frontpage: !document.frontpage})}/>
      <FlatButton
        type="submit"
        backgroundColor={"#bbb"}
        hoverColor={"#ccc"}
        style={{color: "#fff",marginLeft: "5px"}}
        label={"Save as draft"}
        onTouchTap={() => addToAutofilledValues({draft: true})}/>
    </span>}

    <FlatButton
      type="submit"
      backgroundColor={"rgba(100, 169, 105, 0.9)"}
      hoverColor={"rgba(100, 169, 105, 0.6)"}
      style={{color: "#fff", marginLeft: "5px"}}
      onTouchTap={() => collectionName === "posts" && addToAutofilledValues({draft: false})}
      label={"Submit" }/>

    {/* <Button type="submit" bsStyle="primary">
      {submitLabel ? submitLabel : <FormattedMessage id="forms.submit"/>}
    </Button> */}



    {
        cancelCallback
          ?
            <a className="form-cancel" onClick={(e) => {
              e.preventDefault();
              cancelCallback(document);
            }}>{cancelLabel ? cancelLabel :
            <FormattedMessage id="forms.cancel"/>}</a>
          :
        null
    }

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
  addToAutofilledValues: React.PropTypes.func,
  addToSuccessForm: React.PropTypes.func,
  addToSubmitForm: React.PropTypes.func,
}


replaceComponent('FormSubmit', FormSubmit);
