import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interface";
import { loginDto, signupDto } from "./auth.dto";
import { BadRequestException } from "../../common/exceptions/domain.exception";
import { userRepository } from "../../DB/repository";

class AuthinticationService {
  private userModel: userRepository;
  constructor() {
    this.userModel = new userRepository();
  }

  login(inputs: loginDto): loginDto {
    inputs.email = "ahmed";
    return inputs;
  }
  public async signup(inputs: signupDto): Promise<IUser> {
    const [result]: HydratedDocument<IUser>[] = await this.userModel.create({
      data: [inputs]
    });
    if (!result) {  
      throw new BadRequestException("FAIL TO SAVE USER");
    }
    return result.toJSON();
  }
}
export default new AuthinticationService();
