import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { PostSamplingAlgorithm, RecommendationsExperimentSettings, RecommendationsQuery, scoringFeatures, FeatureName, RecommendationResult } from '../../lib/recommendationTypes';
import { useQuery, gql } from '@apollo/client';
import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import keyBy from 'lodash/keyBy';

const styles = (theme: ThemeType): JssStyles => ({
  experimentConfigBlock: {
    ...theme.typography.commentStyle,
    background: theme.palette.panelBackground.default,
    padding: 10,
    margin: 8,
    width: 656,
  },
  experimentConfigRow: {
  },
  experimentConfigLabel: {
    display: "inline-block",
    fontSize: 14,
    width: 120,
  },
  experimentConfigValue: {
    display: "inline-block",
  },
  scoringFeature: {
    ...theme.typography.commentStyle,
    background: theme.palette.panelBackground.default,
    display: "inline-block",
    verticalAlign: "top",
    padding: 10,
    margin: 8,
    width: 320,
    
    "& h2": {
      marginBlockStart: 0,
    },
    "& input": {
      background: theme.palette.panelBackground.darken03,
    },
  },
  getRecommendationsButton: {
    margin: "8px auto",
    display: "block",
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.normal,
  },
});

const defaultSamplingAlgorithm: PostSamplingAlgorithm = {
  features: scoringFeatures.map(f => ({
    name: f.name,
    weight: 1.0,
    options: f.getDefaultOptions(),
  }))
};

const defaultRecommendationsExperimentSettings: RecommendationsExperimentSettings = {
  date: null,
  outputFormat: "list",
  perspective: "myself",
  limit: 20,
};

const RecommendationsExperimentationPage = ({classes}: {
  classes: ClassesType
}) => {
  const [experimentSettings,setExperimentSettings] = useState<RecommendationsExperimentSettings>(defaultRecommendationsExperimentSettings);
  const [samplingAlgorithm,setSamplingAlgorithm] = useState<PostSamplingAlgorithm>(defaultSamplingAlgorithm);
  
  const [selectedQuery,setSelectedQuery] = useState<RecommendationsQuery|null>(null);
  
  const { SingleColumnSection, SectionTitle, RecommendationsExperimentSettingsPicker, PostSamplingAlgorithmPicker, RecommendationExperimentListItem, RecommendationExperimentFeedItem } = Components;
  
  const { data, loading } = useQuery(gql`
    query RecommendationsExperiment($options: JSON!) {
      getCustomRecommendations(options: $options)
    }
  `, {
    ssr: true,
    skip: !selectedQuery,
    variables: {
      options: selectedQuery||{}
    }
  })
  const recommendations: RecommendationResult[]|null = data?.getCustomRecommendations ?? null;
  
  function applySettings() {
    setSelectedQuery({
      overrideDate: experimentSettings.date?.toString() ?? undefined,
      perspective: experimentSettings.perspective,
      limit: experimentSettings.limit,
      features: samplingAlgorithm.features,
    });
  }
  
  return <SingleColumnSection>
    <SectionTitle title="Recommendations Algorithm Experimenter"/>
    
    <RecommendationsExperimentSettingsPicker settings={experimentSettings} setSettings={setExperimentSettings}/>
    <PostSamplingAlgorithmPicker algorithm={samplingAlgorithm} setAlgorithm={setSamplingAlgorithm} />
    
    <Button onClick={applySettings} className={classes.getRecommendationsButton}>
      Get Recommendations
    </Button>
    
    {recommendations?.map((rec) => {
      if (experimentSettings.outputFormat === "list") {
        return <RecommendationExperimentListItem
          key={rec.postId}
          postId={rec.postId}
          rubric={rec.featuresRubric}
          overallScore={rec.score}
        />
      } else {
        return <RecommendationExperimentFeedItem
          key={rec.postId}
          postId={rec.postId}
          rubric={rec.featuresRubric}
          overallScore={rec.score}
        />
      }
    })}
  </SingleColumnSection>
}

const RecommendationsExperimentSettingsPicker = ({settings, setSettings, classes}: {
  settings: RecommendationsExperimentSettings,
  setSettings: (newSettings: RecommendationsExperimentSettings)=>void,
  classes: ClassesType
}) => {
  const { MenuItem } = Components;

  return <div className={classes.experimentConfigBlock}>
    <div className={classes.experimentConfigRow}>
      <div className={classes.experimentConfigLabel}>Simulated date</div>
      <div className={classes.experimentConfigValue}>
        <Components.ReactDateTime
          name={"simulatedDate"}
          value={settings.date ?? undefined}
          position={"below"}
          onChange={(newDate) => setSettings({...settings, date: newDate??null})}
        />
      </div>
    </div>
    <div className={classes.experimentConfigRow}>
      <div className={classes.experimentConfigLabel}>Display Format</div>
      <div className={classes.experimentConfigValue}>
        <Select
          value={settings.outputFormat}
          onChange={(e) => {
            setSettings({...settings, outputFormat: e.target.value as any});
          }}
        >
          <MenuItem value="list">List</MenuItem>
          <MenuItem value="feed">Feed</MenuItem>
        </Select>
      </div>
    </div>
    <div className={classes.experimentConfigRow}>
      <div className={classes.experimentConfigLabel}>Perspective</div>
      <div className={classes.experimentConfigValue}>
        <Select
          value={settings.perspective}
          onChange={(e) => {
            setSettings({...settings, perspective: e.target.value as any});
          }}
        >
          <MenuItem value="myself">Myself</MenuItem>
          <MenuItem value="loggedOut">Logged Out</MenuItem>
        </Select>
      </div>
    </div>
    <div className={classes.experimentConfigRow}>
      <div className={classes.experimentConfigLabel}>Limit</div>
      <div className={classes.experimentConfigValue}>
        <Input type="number"
          value={settings.limit}
          onChange={(e) => setSettings({...settings, limit: parseInt(e.target.value)})}
        />
      </div>
    </div>
  </div>
}

const PostSamplingAlgorithmPicker = ({algorithm, setAlgorithm, classes}: {
  algorithm: PostSamplingAlgorithm,
  setAlgorithm: (newSettings: PostSamplingAlgorithm)=>void,
  classes: ClassesType
}) => {
  const featuresByName = keyBy(algorithm.features, f=>f.name);
  
  function setFeatureWeight(featureName: FeatureName, weight: number) {
    setAlgorithm({
      ...algorithm,
      features: algorithm.features.map(
        f => (f.name===featureName)
          ? {...f, weight} : f
      )
    });
  }
  
  return <div>
    {scoringFeatures.map((feature) => {
      const OptionsForm = feature.optionsForm;
      return <div key={feature.name} className={classes.scoringFeature}>
        <h2>{feature.description}</h2>
        <div>
          Weight{" "}
          <input type="number"
            value={featuresByName[feature.name].weight}
            onChange={(ev) => {
              setFeatureWeight(feature.name, parseFloat(ev.target.value))
            }}
          />
        </div>
        <div>
          {<OptionsForm
            options={featuresByName[feature.name].options ?? feature.getDefaultOptions()}
            setOptions={(newOptions) => {
              const newFeatures = algorithm.features.map(f => (f.name===feature.name) ? {...f, options: newOptions} : f);
              setAlgorithm({...algorithm, features: newFeatures});
            }}
          />}
        </div>
      </div>
    })}
  </div>
}


const RecommendationsExperimentationPageComponent = registerComponent("RecommendationsExperimentationPage", RecommendationsExperimentationPage, {styles});
const RecommendationsExperimentSettingsPickerComponent = registerComponent("RecommendationsExperimentSettingsPicker", RecommendationsExperimentSettingsPicker, {styles});
const PostSamplingAlgorithmPickerComponent = registerComponent("PostSamplingAlgorithmPicker", PostSamplingAlgorithmPicker, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsExperimentationPage: typeof RecommendationsExperimentationPageComponent
    RecommendationsExperimentSettingsPicker: typeof RecommendationsExperimentSettingsPickerComponent
    PostSamplingAlgorithmPicker: typeof PostSamplingAlgorithmPickerComponent
  }
}

