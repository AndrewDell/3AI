import 'react';

declare module 'react' {
  export = React;
  export as namespace React;

  namespace React {
    interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
      type: T;
      props: P;
      key: Key | null;
    }

    type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null);

    type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;

    interface ReactFragment {
      children?: ReactNode[];
    }

    interface ReactPortal extends ReactElement {
      key: Key | null;
      children: ReactNode;
    }

    type Key = string | number;

    interface FC<P = {}> {
      (props: P): ReactElement<P>;
      displayName?: string;
    }

    type PropsWithChildren<P = unknown> = P & { children?: ReactNode | undefined };

    interface FunctionComponent<P = {}> {
      (props: PropsWithChildren<P>, context?: any): ReactElement<any, any> | null;
      displayName?: string;
    }

    function createElement(
      type: string | JSXElementConstructor<any>,
      props?: any,
      ...children: ReactNode[]
    ): ReactElement;

    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    
    function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;

    type Element = ReactElement;

    export interface ChangeEvent<T = Element> {
      target: T;
      currentTarget: T;
    }

    export function useRef<T>(initialValue: T | null): { current: T | null };
    export function useState<T>(initialValue: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  }
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicAttributes {
      key?: React.Key;
    }
    interface IntrinsicElements {
      div: any;
      span: any;
      p: any;
      h3: any;
      [elemName: string]: any;
    }
  }
}

declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        NEXT_PUBLIC_WS_URL: string;
      }
    }
  }
} 