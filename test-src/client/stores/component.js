/* global describe, it, afterEach, document, sinon, expect */
import React from 'react';
import fluxapp, { BaseStore, Component } from '../../../lib';

export default () => {
  describe('component', () => {
    let renderedComponent;

    function renderComponent(Comp, context) {
      const elem = document.createElement('div');

      context = context && context.context ? context.context : fluxapp.createContext(context);
      const ContextWrapper = context.wrapper;

      document.body.appendChild(elem);

      return React.render((
        <ContextWrapper handler={Comp} context={context} />
      ), elem);
    }

    afterEach(() => {
      if (renderedComponent) {
        const elem = renderedComponent.getDOMNode().parentNode;
        React.unmountComponentAtNode(elem);
        document.body.removeChild(elem);
      }

      Object.keys(fluxapp._stores).forEach((id) => {
        fluxapp.removeStore(id);
      });
    });

    it('should expose a getStore method', () => {
      const Comp = class TestComponent extends Component {
        render() {
          expect(this.getStore).to.be.a('function');

          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp);
    });

    it('should return a store when getStore is called', () => {
      const storeClass = class TestStore extends BaseStore {};

      fluxapp.registerStore('test', storeClass);

      const Comp = class TestComponent extends Component {
        render() {
          expect(this.getStore).to.be.a('function');
          expect(this.getStore('test') instanceof BaseStore).to.equal(true);

          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp);
    });

    it('should get notified when a store updates', () => {
      const storeClass = class TestStore extends BaseStore {};

      fluxapp.registerStore('test', storeClass);

      const spy = sinon.spy();
      const context = fluxapp.createContext();

      const Comp = class TestComponent extends Component {
        static stores = {
          onTestUpdate : 'test',
        }

        onTestUpdate() {
          spy();
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      const store = context.getStore('test');

      store.emitChange();

      expect(spy.called).to.equal(true);
    });

    it('should not get notified when a store updates, when unmounted', () => {
      const storeClass = class TestStore extends BaseStore {};

      fluxapp.registerStore('test', storeClass);

      const spy = sinon.spy();
      const context = fluxapp.createContext();
      const store = context.getStore('test');

      const Comp = class TestComponent extends Component {
        static stores = {
          onTestUpdate : 'test',
        }

        onTestUpdate() {
          spy();
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      context.getStore('test');

      store.emitChange();

      expect(spy.called).to.equal(true);

      const elem = renderedComponent.getDOMNode().parentNode;
      React.unmountComponentAtNode(elem);
      document.body.removeChild(elem);

      renderedComponent = null;

      store.emitChange();

      expect(spy.callCount).to.equal(1);
    });

    it('should have access to custom context', () => {
      const storeClass = class TestStore extends BaseStore {
        method() {
          this.setState({
            custom : this.context.custom(),
          });
        }
      };

      fluxapp.registerStore('test', storeClass);

      const spy = sinon.spy();
      const context = fluxapp.createContext({
        custom() {
          return true;
        },
      });
      const store = context.getStore('test');

      const Comp = class TestComponent extends Component {
        static stores = {
          onTestUpdate : 'test',
        }

        onTestUpdate() {
          spy();
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      context.getStore('test');

      store.method();

      const state = store.getState();

      expect(spy.called).to.equal(true);
      expect(state.custom).to.equal(true);
    });
  });
};