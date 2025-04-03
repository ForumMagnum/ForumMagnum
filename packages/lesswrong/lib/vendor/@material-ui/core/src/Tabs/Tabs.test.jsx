import React from 'react';
import { assert } from 'chai';
import { spy, stub, useFakeTimers } from 'sinon';
import { ShallowWrapper } from 'enzyme';
import consoleErrorMock from 'test/utils/consoleErrorMock';
import { createShallow, createMount, getClasses, unwrap } from '../test-utils';
import Tab from '../Tab';
import Tabs from './Tabs';
import TabScrollButton from './TabScrollButton';
import TabIndicator from './TabIndicator';

describe('<Tabs />', () => {
  let mount;
  let shallow;
  let classes;
  const TabsNaked = unwrap(Tabs);
  const noop = () => {};
  const fakeTabs = {
    getBoundingClientRect: () => ({}),
    children: [
      {
        children: [
          {
            getBoundingClientRect: () => ({}),
          },
        ],
      },
    ],
  };

  before(() => {
    shallow = createShallow({ untilSelector: 'Tabs', disableLifecycleMethods: true });
    classes = getClasses(<Tabs onChange={noop} value={0} />);
    mount = createMount();
  });

  after(() => {
    mount.cleanUp();
  });

  it('should render with the root class', () => {
    const wrapper = shallow(
      <Tabs width="md" onChange={noop} value={0}>
        <Tab />
        <Tab />
      </Tabs>,
    );
    assert.strictEqual(wrapper.name(), 'div');
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  describe('warning', () => {
    before(() => {
      consoleErrorMock.spy();
    });

    after(() => {
      consoleErrorMock.reset();
    });

    it('should warn if the input is invalid', () => {
      shallow(<Tabs onChange={noop} value={0} centered scrollable />);
      assert.match(
        consoleErrorMock.args()[0][0],
        /Material-UI: you can not use the `centered={true}` and `scrollable={true}`/,
      );
    });
  });

  describe('prop: action', () => {
    it('should be able to access updateIndicator function', () => {
      let tabsActions = {};
      mount(
        <Tabs
          width="md"
          onChange={noop}
          value={0}
          className="woofTabs"
          action={actions => {
            tabsActions = actions;
          }}
        >
          <Tab />
          <Tab />
        </Tabs>,
      );

      assert.strictEqual(
        typeof tabsActions.updateIndicator === 'function',
        true,
        'Should be a function.',
      );
      tabsActions.updateIndicator();
    });
  });

  describe('prop: className', () => {
    it('should render with the user and root classes', () => {
      const wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0} className="woofTabs">
          <Tab />
          <Tab />
        </Tabs>,
      );
      assert.strictEqual(wrapper.hasClass('woofTabs'), true);
      assert.strictEqual(wrapper.hasClass(classes.root), true);
    });
  });

  describe('prop: centered', () => {
    it('should render with the centered class', () => {
      const wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0} centered>
          <Tab />
          <Tab />
        </Tabs>,
      );
      const selector = `.${classes.flexContainer}.${classes.centered}`;
      assert.strictEqual(wrapper.find(selector).name(), 'div');
      assert.strictEqual(wrapper.find(selector).length, 1);
    });
  });

  describe('prop: children', () => {
    it('should accept an invalid child', () => {
      const wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0}>
          {null}
          <Tab />
        </Tabs>,
      );
      assert.strictEqual(wrapper.find(Tab).length, 1);
    });

    it('should support empty children', () => {
      const wrapper = mount(<Tabs width="md" onChange={noop} value={1} />);
      assert.strictEqual(wrapper.find('EventListener').length, 1);
    });
  });

  describe('prop: value', () => {
    let wrapper;
    before(() => {
      wrapper = shallow(
        <Tabs width="md" onChange={noop} value={1}>
          <Tab />
          <Tab />
        </Tabs>,
      );
    });

    after(() => {
      consoleErrorMock.reset();
    });

    it('should pass selected prop to children', () => {
      assert.strictEqual(
        wrapper
          .find(Tab)
          .at(0)
          .props().selected,
        false,
        'should have selected to false',
      );
      assert.strictEqual(
        wrapper
          .find(Tab)
          .at(1)
          .props().selected,
        true,
        'should have selected',
      );
    });

    it('should switch from the original value', () => {
      wrapper.setProps({ value: 0 });
      assert.strictEqual(
        wrapper
          .find(Tab)
          .at(0)
          .props().selected,
        true,
        'should have switched to true',
      );
      assert.strictEqual(
        wrapper
          .find(Tab)
          .at(1)
          .props().selected,
        false,
        'should have switched to false',
      );
    });

    describe('indicator', () => {
      it('should accept a false value', () => {
        const wrapper2 = mount(
          <Tabs width="md" onChange={noop} value={false}>
            <Tab />
            <Tab />
          </Tabs>,
        );
        assert.strictEqual(wrapper2.find(TabIndicator).props().style.width, 0);
      });

      it('should work server-side', () => {
        const wrapper2 = shallow(
          <Tabs width="md" onChange={noop} value={1}>
            <Tab />
            <Tab />
          </Tabs>,
          { disableLifecycleMethods: true },
        );
        const indicator = new ShallowWrapper(
          wrapper2
            .find(Tab)
            .at(1)
            .props().indicator,
          wrapper2,
        );
        assert.deepEqual(indicator.props().style, {});
      });

      it('should let the selected <Tab /> render the indicator', () => {
        const wrapper2 = shallow(
          <Tabs width="md" onChange={noop} value={1}>
            <Tab />
            <Tab />
          </Tabs>,
          { disableLifecycleMethods: true },
        );
        assert.strictEqual(
          wrapper2
            .find(Tab)
            .at(0)
            .props().indicator,
          false,
        );
        assert.strictEqual(
          wrapper2
            .find(Tab)
            .at(1)
            .props().indicator.type,
          TabIndicator,
        );
      });

      it('should accept any value as selected tab value', () => {
        const tab0 = {};
        const tab1 = {};
        assert.notStrictEqual(tab0, tab1);
        const wrapper2 = shallow(
          <Tabs width="md" onChange={noop} value={tab0}>
            <Tab value={tab0} />
            <Tab value={tab1} />
          </Tabs>,
        );
        assert.strictEqual(wrapper2.instance().valueToIndex.size, 2);
      });

      it('should render the indicator', () => {
        const wrapper2 = mount(
          <Tabs width="md" onChange={noop} value={1}>
            <Tab />
            <Tab />
          </Tabs>,
        );
        assert.strictEqual(
          wrapper2
            .find(Tab)
            .at(0)
            .props().indicator,
          false,
        );
        assert.strictEqual(
          wrapper2
            .find(Tab)
            .at(1)
            .props().indicator,
          false,
        );
        assert.strictEqual(wrapper2.find(TabIndicator).length, 1);
      });

      it('should update the indicator state no matter what', () => {
        const wrapper2 = mount(
          <TabsNaked width="md" onChange={noop} value={1} classes={{}} theme={{}}>
            <Tab />
            <Tab />
          </TabsNaked>,
        );
        const instance = wrapper2.instance();
        stub(instance, 'scrollSelectedIntoView');

        wrapper2.setState({
          indicatorStyle: {
            left: 10,
            width: 40,
          },
        });
        wrapper2.setProps({
          value: 0,
        });

        assert.strictEqual(
          instance.scrollSelectedIntoView.callCount >= 2,
          true,
          'should have called scrollSelectedIntoView',
        );
      });
    });

    it('should warn when the value is invalid', () => {
      consoleErrorMock.spy();
      mount(
        <Tabs width="md" onChange={noop} value={2}>
          <Tab />
          <Tab />
        </Tabs>,
      );
      assert.strictEqual(consoleErrorMock.callCount(), 3);
      assert.strictEqual(
        consoleErrorMock.args()[0][0],
        'Warning: Material-UI: the value provided `2` is invalid',
      );
    });
  });

  describe('prop: onChange', () => {
    it('should call onChange when clicking', () => {
      const handleChange = spy();
      // use mount to ensure that click event on Tab can be fired
      const wrapper = mount(
        <Tabs width="md" value={0} onChange={handleChange}>
          <Tab />
          <Tab />
        </Tabs>,
      );
      wrapper
        .find(Tab)
        .at(1)
        .simulate('click');
      wrapper.setProps({ value: 1 });
      assert.strictEqual(handleChange.callCount, 1, 'should have been called once');
      assert.strictEqual(handleChange.args[0][1], 1, 'should have been called with value 1');
      wrapper.unmount();
    });
  });

  describe('prop: scrollable', () => {
    let clock;
    let wrapper;

    before(() => {
      clock = useFakeTimers();
      wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0} scrollable>
          <Tab />
          <Tab />
        </Tabs>,
      );
    });

    after(() => {
      clock.restore();
    });

    it('should render with the scrollable class', () => {
      const selector = `.${classes.scroller}.${classes.scrollable}`;
      assert.strictEqual(wrapper.find(selector).name(), 'div');
      assert.strictEqual(wrapper.find(selector).length, 1);
    });

    it('should response to scroll events', () => {
      const instance = wrapper.instance();
      instance.tabsRef = { scrollLeft: 100, ...fakeTabs };
      spy(instance, 'updateScrollButtonState');
      const selector = `.${classes.scroller}.${classes.scrollable}`;
      wrapper.find(selector).simulate('scroll');
      clock.tick(166);
      assert.strictEqual(
        instance.updateScrollButtonState.called,
        true,
        'should have called updateScrollButtonState',
      );
    });

    it('should get a scrollbar size listener', () => {
      // use mount to ensure that handleScrollbarSizeChange gets covered
      const mountWrapper = mount(
        <Tabs width="md" onChange={noop} value={0} scrollable>
          <Tab />
          <Tab />
        </Tabs>,
      );
      assert.strictEqual(mountWrapper.find('ScrollbarSize').length, 1);
      mountWrapper.unmount();
    });
  });

  describe('prop: !scrollable', () => {
    it('should not render with the scrollable class', () => {
      const wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0}>
          <Tab />
          <Tab />
        </Tabs>,
      );
      const baseSelector = `.${classes.scroller}`;
      const selector = `.${classes.scroller}.${classes.scrollable}`;
      assert.strictEqual(wrapper.find(baseSelector).length, 1);
      assert.strictEqual(wrapper.find(selector).length, 0);
    });
  });

  describe('prop: scrollButtons', () => {
    let clock;

    before(() => {
      clock = useFakeTimers();
    });

    after(() => {
      clock.restore();
    });

    it('should render scroll buttons', () => {
      const wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0} scrollable scrollButtons="on">
          <Tab />
          <Tab />
        </Tabs>,
      );
      assert.strictEqual(wrapper.find(TabScrollButton).length, 2, 'should be two');
    });

    it('should render scroll buttons automatically', () => {
      const wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0} scrollable scrollButtons="auto">
          <Tab />
          <Tab />
        </Tabs>,
      );
      assert.strictEqual(wrapper.find(TabScrollButton).length, 2, 'should be two');
    });

    it('should should not render scroll buttons automatically', () => {
      const wrapper = shallow(
        <Tabs width="sm" onChange={noop} value={0} scrollable scrollButtons="auto">
          <Tab />
          <Tab />
        </Tabs>,
      );
      assert.strictEqual(wrapper.find(TabScrollButton).length, 2, 'should be zero');
      assert.strictEqual(
        wrapper.find(TabScrollButton).everyWhere(node => node.hasClass(classes.scrollButtonsAuto)),
        true,
      );
    });

    it('should handle window resize event', () => {
      const wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0} scrollable scrollButtons="on">
          <Tab />
          <Tab />
        </Tabs>,
      );
      const instance = wrapper.instance();
      stub(instance, 'updateScrollButtonState');
      stub(instance, 'updateIndicatorState');
      wrapper
        .find('EventListener')
        .at(0)
        .simulate('resize');
      clock.tick(166);
      assert.strictEqual(instance.updateScrollButtonState.called, true);
      assert.strictEqual(instance.updateIndicatorState.called, true);
    });

    describe('scroll button visibility states', () => {
      let wrapper;
      let instance;
      before(() => {
        wrapper = shallow(
          <Tabs width="md" onChange={noop} value={0} scrollable scrollButtons="on">
            <Tab />
            <Tab />
          </Tabs>,
        );
        instance = wrapper.instance();
      });

      it('should set neither left nor right scroll button state', () => {
        instance.tabsRef = { scrollLeft: 0, scrollWidth: 90, clientWidth: 100, ...fakeTabs };
        instance.updateScrollButtonState();
        assert.strictEqual(wrapper.state().showLeftScroll, false);
        assert.strictEqual(wrapper.state().showRightScroll, false);
      });

      it('should set only left scroll button state', () => {
        instance.tabsRef = { scrollLeft: 1, ...fakeTabs };
        instance.updateScrollButtonState();
        assert.strictEqual(wrapper.state().showLeftScroll, true);
        assert.strictEqual(wrapper.state().showRightScroll, false);
      });

      it('should set only right scroll button state', () => {
        instance.tabsRef = { scrollLeft: 0, scrollWidth: 110, clientWidth: 100, ...fakeTabs };
        instance.updateScrollButtonState();
        assert.strictEqual(wrapper.state().showLeftScroll, false);
        assert.strictEqual(wrapper.state().showRightScroll, true);
      });

      it('should set both left and right scroll button state', () => {
        instance.tabsRef = { scrollLeft: 1, scrollWidth: 110, clientWidth: 100, ...fakeTabs };
        instance.updateScrollButtonState();
        assert.strictEqual(wrapper.state().showLeftScroll, true);
        assert.strictEqual(wrapper.state().showRightScroll, true);
      });
    });
  });

  describe('scroll button behavior', () => {
    let instance;
    let wrapper;
    let scrollSpy;
    const dimensions = { scrollLeft: 100, clientWidth: 200, scrollWidth: 1000 };
    before(() => {
      wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0} scrollable scrollButtons="on">
          <Tab />
          <Tab />
        </Tabs>,
      );
      instance = wrapper.instance();
      instance.tabsRef = dimensions;
      scrollSpy = spy(instance, 'moveTabsScroll');
    });

    it('should call moveTabsScroll', () => {
      wrapper
        .find(TabScrollButton)
        .at(0)
        .simulate('click');
      assert.strictEqual(
        scrollSpy.args[0][0],
        -dimensions.clientWidth,
        `should be called with -${dimensions.clientWidth}`,
      );
      wrapper
        .find(TabScrollButton)
        .at(1)
        .simulate('click');
      assert.strictEqual(
        scrollSpy.args[1][0],
        dimensions.clientWidth,
        `should be called with ${dimensions.clientWidth}`,
      );
    });
  });

  describe('scroll into view behavior', () => {
    let scrollStub;
    let instance;
    let metaStub;

    beforeEach(() => {
      const wrapper = shallow(
        <Tabs width="md" onChange={noop} value={0} scrollable>
          <Tab />
          <Tab />
        </Tabs>,
      );
      instance = wrapper.instance();
      scrollStub = stub(instance, 'scroll');
      metaStub = stub(instance, 'getTabsMeta');
    });

    afterEach(() => {
      instance.scroll.restore();
    });

    it('should scroll left tab into view', () => {
      metaStub.returns({
        tabsMeta: { left: 0, right: 100, scrollLeft: 10 },
        tabMeta: { left: -10, right: 10 },
      });

      instance.scrollSelectedIntoView();
      assert.strictEqual(scrollStub.args[0][0], 0);
    });

    it('should scroll right tab into view', () => {
      metaStub.returns({
        tabsMeta: { left: 0, right: 100, scrollLeft: 0 },
        tabMeta: { left: 90, right: 110 },
      });

      instance.scrollSelectedIntoView();
      assert.strictEqual(scrollStub.args[0][0], 10);
    });

    it('should support value=false', () => {
      metaStub.returns({
        tabsMeta: { left: 0, right: 100, scrollLeft: 0 },
        tabMeta: undefined,
      });

      instance.scrollSelectedIntoView();
      assert.strictEqual(scrollStub.callCount, 0);
    });
  });

  describe('prop: TabIndicatorProps', () => {
    it('should merge the style', () => {
      const wrapper = shallow(
        <Tabs onChange={noop} value={0} TabIndicatorProps={{ style: { backgroundColor: 'green' } }}>
          <Tab />
        </Tabs>,
      );
      wrapper.setState({ mounted: true });
      assert.strictEqual(wrapper.find(TabIndicator).props().style.backgroundColor, 'green');
    });
  });
});
