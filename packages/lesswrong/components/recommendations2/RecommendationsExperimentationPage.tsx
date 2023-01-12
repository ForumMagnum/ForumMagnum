import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { PostSamplingAlgorithm, RecommendationsExperimentSettings, RecommendationsQuery, scoringFeatures, FeatureName, RecommendationResult, RecommendationRubric } from '../../lib/recommendationTypes';
import { useQuery, gql } from '@apollo/client';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import keyBy from 'lodash/keyBy';

const styles = (theme: ThemeType): JssStyles => ({
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
};

const RecommendationsExperimentationPage = ({classes}: {
  classes: ClassesType
}) => {
  const [experimentSettings,setExperimentSettings] = useState<RecommendationsExperimentSettings>(defaultRecommendationsExperimentSettings);
  const [samplingAlgorithm,setSamplingAlgorithm] = useState<PostSamplingAlgorithm>(defaultSamplingAlgorithm);
  
  const [selectedQuery,setSelectedQuery] = useState<RecommendationsQuery|null>(null);
  const [presentationFormat,setPresentationFormat] = useState<"list"|"feed">("list");
  
  const { SingleColumnSection, SectionTitle, RecommendationsExperimentSettingsPicker, PostSamplingAlgorithmPicker, RecommendationsRubric, RecommendationExperimentResult } = Components;
  
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
      overrideDate: experimentSettings.date ?? undefined,
      limit: 20, //TODO
      features: samplingAlgorithm.features,
    });
  }
  
  return <SingleColumnSection>
    <SectionTitle title="Recommendations Algorithm Experimenter"/>
    
    <RecommendationsExperimentSettingsPicker settings={experimentSettings} setSettings={setExperimentSettings}/>
    <PostSamplingAlgorithmPicker algorithm={samplingAlgorithm} setAlgorithm={setSamplingAlgorithm} />
    
    <Button onClick={applySettings}>
      Apply
    </Button>
    
    {data?.getCustomRecommendations?.map(rec => <RecommendationExperimentResult
      key={rec.postId}
      displayStyle={experimentSettings.outputFormat}
      postId={rec.postId}
      rubric={rec.featuresRubric}
      overallScore={rec.score}
    />)}
  </SingleColumnSection>
}

const RecommendationsExperimentSettingsPicker = ({settings, setSettings, classes}: {
  settings: RecommendationsExperimentSettings,
  setSettings: (newSettings: RecommendationsExperimentSettings)=>void,
  classes: ClassesType
}) => {
  return <div>
    <div>
      Simulated date:
      <Components.ReactDateTime
        name={"simulatedDate"}
        value={settings.date ?? undefined}
        position={"below"}
        onChange={(newDate) => setSettings({...settings, date: newDate??null})}
      />
    </div>
    <div>
      Display format:
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
      return <div key={feature.name}>
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
              /*setAlgorithm({
                ...algorithm,
                features: algorithm.features.map(
                  f => (f.name===feature.name)
                    ? {...f, options: newOptions} : f
                )
              });*/
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

