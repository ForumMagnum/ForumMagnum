import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import NoSSR from 'react-no-ssr';


class ConfigurableRecommendationsList extends PureComponent {
  state = {
    algorithm: "top"
  }
  
  render() {
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList } = Components;
    console.log
    
    return <SingleColumnSection>
      <SectionTitle title="Recommended" />
      <RecommendationsAlgorithmPicker
        selectedAlgorithm={this.state.algorithm}
        onPickAlgorithm={(alg) => this.setState({algorithm: alg})}
      />
      <NoSSR>
        <RecommendationsList
          count={10}
          method={this.state.algorithm}
        />
      </NoSSR>
    </SingleColumnSection>
  }
}

registerComponent("ConfigurableRecommendationsList", ConfigurableRecommendationsList);