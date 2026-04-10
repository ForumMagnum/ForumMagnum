import type { RouterLocation } from '../../lib/routeChecks/parseRoute';
import type { JssStylesCallback } from '@/lib/jssStyles';
import type { StyleDefinition } from '@/server/styleGeneration';

declare global {

type AnyStyles = JssStylesCallback<string>|StyleDefinition<string>;

type StylesCallbackFrom<Styles extends AnyStyles> =
  Styles extends StyleDefinition<infer ClassKey>
    ? JssStylesCallback<ClassKey>
    : Styles extends JssStylesCallback<infer ClassKey>
      ? JssStylesCallback<ClassKey>
      : never;

type ClassesType<
  Styles extends AnyStyles,
> = Readonly<Record<keyof ReturnType<StylesCallbackFrom<Styles>>, string>>;

type ClassNameIn<T extends StyleDefinition> = keyof ClassesType<T>

interface WithStylesProps<T extends AnyStyles=AnyStyles> {
  classes: ClassesType<T>,
}

interface WithUserProps {
  currentUser: UsersCurrent|null,
}

interface WithTrackingProps {
  captureEvent: any,
}

interface WithLocationProps {
  location: RouterLocation,
}

interface WithDialogProps {
  openDialog: any,
}

interface WithGlobalKeydownProps {
  addKeydownListener: any,
}

// This is a bit arcane. I think of this basically as a type "function" that
// says, for a given collection base, I am the DbObject extension it is using.
// https://stackoverflow.com/questions/63631364/infer-nested-generic-types-in-typescript/63631544#63631544
type DbObjectForCollectionBase<C> = C extends CollectionBase<infer T> ? T : never

type NullablePartial<T> = { [K in keyof T]?: T[K]|null|undefined }

}
