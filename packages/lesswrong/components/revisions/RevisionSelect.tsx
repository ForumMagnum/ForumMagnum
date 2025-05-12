import React, { useCallback, useState } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import classNames from 'classnames';
import FormatDate from "../common/FormatDate";
import UsersName from "../users/UsersName";
import LoadMore from "../common/LoadMore";
import LWTooltip from "../common/LWTooltip";
import ChangeMetricsDisplay from "../tagging/ChangeMetricsDisplay";

const styles = (theme: ThemeType) => ({
  revisionRow: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginBottom: 6
  },
  radio: {
    padding: 4,
    '& svg': {
      fontSize: 18,
      opacity: .4
    }
  },
  checked: {
    '& svg': {
      opacity: 1
    }
  },
  radioDisabled: {
    color: "transparent !important",
  },
  button: {
    marginBottom: 12,
    marginTop: 6
  },
  username: {
    color: theme.palette.text.normal,
    paddingRight: 10,
    paddingLeft: 4
  },
  link: {
    paddingRight: 8,
    whiteSpace: 'nowrap'
  },
  version: {
    display: "inline-block",
    width: 50
  }
});

const RevisionSelect = ({ revisions, getRevisionUrl, onPairSelected, loadMoreProps, classes, count, totalCount }: {
  revisions: Array<RevisionMetadataWithChangeMetrics>,
  getRevisionUrl: (rev: RevisionMetadata) => string,
  onPairSelected: ({before, after}: {before: RevisionMetadata, after: RevisionMetadata}) => void,
  loadMoreProps: any,
  classes: ClassesType<typeof styles>,
  count?: number,
  totalCount?: number
}) => {
  const [beforeRevisionIndex, setBeforeRevisionIndex] = useState(1);
  const [afterRevisionIndex, setAfterRevisionIndex] = useState(0);
  
  const compareRevs = useCallback(() => {
    if (!revisions) return;
    onPairSelected({
      before: revisions[beforeRevisionIndex],
      after: revisions[afterRevisionIndex]
    });
  }, [beforeRevisionIndex, afterRevisionIndex, onPairSelected, revisions]);

  return <React.Fragment>
    <table>
      <tbody>
      {revisions.map((rev,i) => {
        const beforeDisabled = i<=afterRevisionIndex;
        const afterDisabled = i>=beforeRevisionIndex;
        
        return (
          <tr key={rev.version} className={classes.revisionRow}>
            <td>
              <LWTooltip title={<div>Select as the <em>first</em> revision to compare</div>}>
                <Radio
                  className={classNames(classes.radio, {[classes.checked]: i===beforeRevisionIndex, [classes.radioDisabled]: beforeDisabled})}
                  disabled={beforeDisabled}
                  checked={i===beforeRevisionIndex}
                  onChange={(ev, checked) => {
                    if (checked) {
                      setBeforeRevisionIndex(i);
                    }
                  }}
                />
              </LWTooltip>
            </td>
            <td>
              <LWTooltip title={<div>Select as the <em>second</em> revision to compare</div>}>
                <Radio
                  className={classNames(classes.radio, {[classes.checked]: i===afterRevisionIndex, [classes.radioDisabled]: afterDisabled})}
                  disabled={afterDisabled}
                  checked={i===afterRevisionIndex}
                  onChange={(ev, checked) => {
                    if (checked) {
                      setAfterRevisionIndex(i);
                    }
                  }}
                />
                </LWTooltip>
            </td>
            <td className={classes.username}>
              <UsersName documentId={rev.userId ?? undefined}/>{" "}
            </td>
            <td className={classes.link}>
              <Link to={getRevisionUrl(rev)}>
                <span className={classes.version}>v{rev.version}</span>
                <FormatDate format={"MMM Do YYYY z"} date={rev.editedAt}/>{" "}
              </Link>
            </td>
            <td>
              <ChangeMetricsDisplay changeMetrics={rev.changeMetrics}/>
              {" "}
              {rev.commitMessage}
            </td>
          </tr>
        )
      })}
      </tbody>
    </table>
 
    <div><LoadMore {...loadMoreProps} totalCount={totalCount} count={count}/></div>
    <Button className={classes.button} variant="outlined" onClick={compareRevs} >Compare selected revisions</Button>
  </React.Fragment>
}

export default registerComponent(
  'RevisionSelect', RevisionSelect, {styles}
);


