import { crosspostKarmaThreshold } from "../../lib/publicSettings";
import CrosspostDbOperations from "./CrosspostDbOperations";
import TokenService from "./TokenService";
import { InsufficientKarmaError, InvalidUserError } from "./CrosspostErrors";
import { ID_LENGTH } from "../../lib/random";
import { z } from "zod";

const newCrossposterPayloadValidator = z.object({
  userId: z.string().length(ID_LENGTH),
});

type NewCrossposterPayload = z.infer<typeof newCrossposterPayloadValidator>;

/**
 * The CrosspostService handles the majority of the business logic for crossposting.
 * In general, method signatures can be strongly typed as the CrosspostController has
 * already run all the necessary schema validations of user input.
 */
class CrosspostService {
  constructor(
    private dbOperations = new CrosspostDbOperations(),
    private tokenService = new TokenService(),
  ) {}

  createNewCrossposterPayload(user: DbUser): NewCrossposterPayload {
    this.assertUserHasPermissionToCrosspost(user);
    return {userId: user._id};
  }

  async createNewCrossposterToken(user: DbUser): Promise<string> {
    const payload = this.createNewCrossposterPayload(user);
    return this.tokenService.encode(payload);
  }

  async connectNewCrossposter(localUserId: string, token: string) {
  }

  private assertUserHasPermissionToCrosspost(user: DbUser) {
    if (!user) {
      throw new InvalidUserError();
    }
    if (user.isAdmin) {
      return;
    }

    const userKarma = user.karma ?? 0;
    const currentKarmaThreshold = crosspostKarmaThreshold.get();
    if (currentKarmaThreshold !== null && currentKarmaThreshold > userKarma) {
      throw new InsufficientKarmaError(currentKarmaThreshold);
    }
  }
}

export default CrosspostService;
